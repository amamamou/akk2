"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { InvoiceInfo, TenantSettingsData } from "@/types/api";
import {
  dashboardAccentShadow,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/lib/format-currency";

const TIER_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Growth",
  ENTERPRISE: "Enterprise",
};

function formatDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, opts ?? {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function InvoiceStatusBadge({ status }: { status: InvoiceInfo["status"] }) {
  const paid = status === "PAID";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        paid
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40"
          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40"
      )}
    >
      {paid ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <Clock size={12} strokeWidth={2.5} />}
      {paid ? "Paid" : "Due"}
    </span>
  );
}

function BillingOverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-zinc-800" />
      <div className="h-8 w-40 rounded bg-gray-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 dark:border-zinc-800 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-gray-100 dark:bg-zinc-800/60" />
        ))}
      </div>
    </div>
  );
}

function BillingOverview({ settings }: { settings: TenantSettingsData }) {
  const tier = (settings.subscriptionTier || "STARTER").toUpperCase();
  const planLabel = settings.planName || TIER_LABELS[tier] || tier;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={dashboardSectionLabel}>Current plan</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className={dashboardPanelTitle}>{planLabel}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#A473FF]/10 px-2.5 py-0.5 text-xs font-medium text-[#7C3AED] ring-1 ring-[#A473FF]/15 dark:text-[#A473FF]">
              <Sparkles size={11} />
              {TIER_LABELS[tier] ?? tier}
            </span>
          </div>
          <p className={cn(dashboardPanelSubtitle, "mt-1")}>
            Monthly billing · Active subscription
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-opacity hover:opacity-90",
            dashboardAccentShadow
          )}
          style={{
            background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
          }}
        >
          <TrendingUp size={15} />
          Upgrade plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 dark:border-zinc-800 sm:grid-cols-3">
        <div>
          <p className={dashboardSectionLabel}>Billing cycle</p>
          <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-zinc-100">Monthly</p>
          <p className="mt-0.5 text-xs text-gray-400">Renews automatically</p>
        </div>
        <div>
          <p className={dashboardSectionLabel}>Player seats</p>
          <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-zinc-100">
            {settings.usedPlayers} / {settings.maxPlayers}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">Registered in workspace</p>
        </div>
        <div>
          <p className={dashboardSectionLabel}>Storage</p>
          <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-zinc-100">
            {settings.usedStorageGb} / {settings.maxStorageGb} GB
          </p>
          <p className="mt-0.5 text-xs text-gray-400">Media library usage</p>
        </div>
      </div>
    </section>
  );
}

function InvoiceRow({ invoice }: { invoice: InvoiceInfo }) {
  return (
    <div className="flex flex-col gap-3 py-4 transition-colors first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
          <Receipt size={16} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-gray-950 dark:text-zinc-100">{invoice.invoiceNumber}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              Due {formatDate(invoice.dueDate)}
            </span>
            {invoice.createdAt ? (
              <span>Issued {formatDate(invoice.createdAt)}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:pl-4">
        <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
          {formatMoney(invoice.amount)}
        </p>
        <InvoiceStatusBadge status={invoice.status} />
        {invoice.downloadUrl ? (
          <a
            href={invoice.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download size={13} />
            PDF
            <ExternalLink size={11} className="opacity-50" />
          </a>
        ) : (
          <span className="text-xs text-gray-400">No PDF</span>
        )}
      </div>
    </div>
  );
}

export default function BillingTab() {
  const apiClient = getApiClient();
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [settings, setSettings] = useState<TenantSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!apiClient.isAuthenticated()) {
          if (!cancelled) setError("Sign in to view billing.");
          return;
        }

        const [invoicesRes, settingsRes] = await Promise.allSettled([
          apiClient.listInvoices(),
          apiClient.getTenantSettings(),
        ]);

        if (cancelled) return;

        if (invoicesRes.status === "fulfilled") {
          setInvoices(invoicesRes.value.invoices ?? []);
        } else {
          throw invoicesRes.reason;
        }

        if (settingsRes.status === "fulfilled") {
          setSettings(settingsRes.value.settings);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            (err instanceof Error ? err.message : "Failed to load billing");
          setError(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status === "UNPAID").reduce((sum, i) => sum + i.amount, 0),
    [invoices]
  );

  if (isLoading) {
    return (
      <div className="space-y-10">
        <BillingOverviewSkeleton />
        <div className="animate-pulse space-y-3 border-t border-gray-100 pt-8 dark:border-zinc-800">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-zinc-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-100 dark:bg-zinc-800/60" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {settings ? <BillingOverview settings={settings} /> : null}

      <section className="border-t border-gray-100 pt-8 dark:border-zinc-800">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className={dashboardPanelTitle}>Invoices</h3>
            <p className={cn(dashboardPanelSubtitle, "mt-0.5")}>
              {invoices.length === 0
                ? "Your billing history will appear here."
                : `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} on record`}
            </p>
          </div>
          {outstanding > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {formatMoney(outstanding)} outstanding
            </p>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="py-10 text-center">
            <Receipt size={28} className="mx-auto text-gray-300 dark:text-zinc-600" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">No invoices yet</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              Manual invoices for your workspace will appear here once registered.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
