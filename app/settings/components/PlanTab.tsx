"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  HardDrive,
  Loader2,
  Monitor,
  Repeat,
  Save,
  TrendingUp,
  Users,
} from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { ClientInfo, TenantSettingsData } from "@/types/api";
import {
  dashboardAccentShadow,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import { useAuth } from "@/app/context/AuthContext";
import { isSuperAdminRole } from "@/lib/rbac";

const SUBSCRIPTION_TIERS = ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

const TIER_LOCKS: Record<Exclude<SubscriptionTier, "ENTERPRISE">, { maxPlayers: number; maxStorageGb: number }> = {
  STARTER: { maxPlayers: 5, maxStorageGb: 2 },
  PROFESSIONAL: { maxPlayers: 20, maxStorageGb: 20 },
};

const TIER_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Growth",
  ENTERPRISE: "Enterprise",
};

const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  STARTER: "Up to 5 players · 2 GB storage",
  PROFESSIONAL: "Up to 20 players · 20 GB storage",
  ENTERPRISE: "Custom player and storage limits",
};

const TABLE_INPUT_CLASS =
  "h-9 w-full min-w-[5rem] rounded-xl border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

type MasterClientRow = {
  clientId: string;
  workspaceName: string;
  tenantId?: string;
  subscriptionTier: SubscriptionTier;
  registeredDevices: number;
  maxPlayers: number;
  maxStorageGb: number;
};

type RowDraft = {
  subscriptionTier: SubscriptionTier;
  maxPlayers: string;
  maxStorageGb: string;
};

function TierBadge({ tier }: { tier: string }) {
  const label = TIER_LABELS[tier] ?? tier;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      <Repeat size={11} strokeWidth={2} />
      {label}
    </span>
  );
}

function UsageMeter({
  label,
  used,
  max,
  unit,
}: {
  label: string;
  used: number;
  max: number;
  unit?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const atLimit = max > 0 && used >= max;
  const remaining = max > 0 ? Math.max(0, max - used) : null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{label}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
            {remaining !== null
              ? atLimit
                ? "Limit reached — contact support to increase"
                : `${remaining}${unit ? ` ${unit}` : ""} remaining`
              : "No limit configured"}
          </p>
        </div>
        <p className="shrink-0 text-right text-sm tabular-nums text-gray-900 dark:text-zinc-100">
          <span className="font-semibold">{used}</span>
          <span className="text-gray-400 dark:text-zinc-500">
            {" "}
            / {max > 0 ? max : "—"}
            {unit ? ` ${unit}` : ""}
          </span>
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            atLimit ? "bg-amber-500" : pct >= 80 ? "bg-amber-400" : "bg-[#A473FF]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs tabular-nums text-gray-400 dark:text-zinc-500">{pct}% used</p>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-zinc-800" />
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-6 border-t border-gray-100 pt-8 dark:border-zinc-800">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-zinc-800" />
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800" />
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function normalizeClient(client: Record<string, unknown>): ClientInfo {
  return {
    id: String(client.id),
    tenantId: (client.tenantId ?? client.tenant_id) as string | undefined,
    name: String(client.name ?? "Untitled client"),
    businessType: String(client.businessType ?? client.business_type ?? ""),
    contactPerson: String(client.contactPerson ?? client.contact_person ?? ""),
    email: String(client.email ?? ""),
    phone: String(client.phone ?? ""),
    status: (client.status ?? "INACTIVE") as ClientInfo["status"],
    subscriptionTier: (client.subscriptionTier ??
      client.subscription_tier ??
      "STARTER") as ClientInfo["subscriptionTier"],
    maxPlayers: Number(client.maxPlayers ?? client.max_players ?? 0),
    maxStorageGb: Number(client.maxStorageGb ?? client.max_storage_gb ?? 0),
    createdAt: (client.createdAt ?? client.created_at) as string | undefined,
  };
}

function TenantPlanView({
  settings,
  onOpenBilling,
}: {
  settings: TenantSettingsData;
  onOpenBilling?: () => void;
}) {
  const tier = (settings.subscriptionTier || settings.planName || "STARTER").toUpperCase() as SubscriptionTier;
  const planLabel = settings.planName || TIER_LABELS[tier] || tier;
  const tierSummary = TIER_DESCRIPTIONS[tier] ?? "Workspace subscription";

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className={dashboardSectionLabel}>Subscription</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className={dashboardPanelTitle}>{planLabel}</h2>
              <TierBadge tier={tier} />
            </div>
            <p className={cn(dashboardPanelSubtitle, "max-w-xl")}>
              {tierSummary}. Billed monthly and renewed automatically.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {onOpenBilling ? (
              <button
                type="button"
                onClick={onOpenBilling}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Billing & invoices
                <ArrowRight size={14} className="opacity-60" />
              </button>
            ) : null}
            <button
              type="button"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-opacity hover:opacity-90",
                dashboardAccentShadow
              )}
              style={{
                background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
              }}
            >
              <TrendingUp size={15} />
              Request upgrade
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="border-t border-gray-100 pt-4 dark:border-zinc-800 sm:border-t-0 sm:pt-0">
            <dt className={dashboardSectionLabel}>Billing cycle</dt>
            <dd className="mt-1.5 text-sm font-medium text-gray-900 dark:text-zinc-100">Monthly</dd>
          </div>
          <div className="border-t border-gray-100 pt-4 dark:border-zinc-800 sm:border-t-0 sm:pt-0">
            <dt className={dashboardSectionLabel}>Player seats</dt>
            <dd className="mt-1.5 text-sm font-medium tabular-nums text-gray-900 dark:text-zinc-100">
              {settings.maxPlayers} included
            </dd>
          </div>
          <div className="border-t border-gray-100 pt-4 dark:border-zinc-800 sm:border-t-0 sm:pt-0">
            <dt className={dashboardSectionLabel}>Storage</dt>
            <dd className="mt-1.5 text-sm font-medium tabular-nums text-gray-900 dark:text-zinc-100">
              {settings.maxStorageGb} GB included
            </dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-gray-100 pt-8 dark:border-zinc-800">
        <div className="mb-6 max-w-2xl">
          <h3 className={dashboardPanelTitle}>Usage</h3>
          <p className={cn(dashboardPanelSubtitle, "mt-1")}>
            How much of your subscription you&apos;ve used in this workspace.
          </p>
        </div>
        <div className="max-w-2xl space-y-8">
          <UsageMeter
            label="Registered players"
            used={settings.usedPlayers}
            max={settings.maxPlayers}
          />
          <UsageMeter
            label="Media storage"
            used={settings.usedStorageGb}
            max={settings.maxStorageGb}
            unit="GB"
          />
        </div>
      </section>

      <section className="border-t border-gray-100 pt-8 dark:border-zinc-800">
        <h3 className={dashboardPanelTitle}>Included with your plan</h3>
        <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-zinc-400">
          <li className="flex items-start gap-2.5">
            <Users size={15} className="mt-0.5 shrink-0 text-gray-400" strokeWidth={1.75} />
            <span>
              <span className="font-medium text-gray-900 dark:text-zinc-100">Player seats</span>
              {" — "}
              register up to {settings.maxPlayers} devices in your workspace
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <HardDrive size={15} className="mt-0.5 shrink-0 text-gray-400" strokeWidth={1.75} />
            <span>
              <span className="font-medium text-gray-900 dark:text-zinc-100">Media storage</span>
              {" — "}
              {settings.maxStorageGb} GB for audio and playlist assets
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Repeat size={15} className="mt-0.5 shrink-0 text-gray-400" strokeWidth={1.75} />
            <span>
              <span className="font-medium text-gray-900 dark:text-zinc-100">Automatic renewal</span>
              {" — "}
              subscription continues each month unless changed
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}

function isDraftDirty(row: MasterClientRow, draft: RowDraft | undefined): boolean {
  if (!draft) return false;
  return (
    draft.subscriptionTier !== row.subscriptionTier ||
    Number(draft.maxPlayers) !== row.maxPlayers ||
    Number(draft.maxStorageGb) !== row.maxStorageGb
  );
}

function MasterClientCard({
  row,
  draft,
  saving,
  onDraftChange,
  onSave,
}: {
  row: MasterClientRow;
  draft: RowDraft | undefined;
  saving: boolean;
  onDraftChange: (patch: Partial<RowDraft>) => void;
  onSave: () => void;
}) {
  const tier = draft?.subscriptionTier ?? row.subscriptionTier;
  const isEnterprise = tier === "ENTERPRISE";
  const dirty = isDraftDirty(row, draft);

  return (
    <article className="border-t border-gray-100 py-6 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-zinc-100">{row.workspaceName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
            <Monitor size={12} />
            {row.registeredDevices} active device{row.registeredDevices === 1 ? "" : "s"}
          </p>
        </div>
        <TierBadge tier={tier} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={cn(dashboardSectionLabel, "mb-1.5 block")}>Plan</label>
          <select
            value={tier}
            onChange={(e) =>
              onDraftChange({ subscriptionTier: e.target.value as SubscriptionTier })
            }
            className={TABLE_INPUT_CLASS}
          >
            {SUBSCRIPTION_TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABELS[t] ?? t}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
            {TIER_DESCRIPTIONS[tier]}
          </p>
        </div>

        <div>
          <label className={cn(dashboardSectionLabel, "mb-1.5 block")}>Max players</label>
          <input
            type="number"
            min={1}
            value={draft?.maxPlayers ?? String(row.maxPlayers)}
            disabled={!isEnterprise}
            onChange={(e) => onDraftChange({ maxPlayers: e.target.value })}
            className={cn(TABLE_INPUT_CLASS, !isEnterprise && "cursor-not-allowed opacity-50")}
          />
          {!isEnterprise ? (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500">Fixed for this tier</p>
          ) : null}
        </div>

        <div>
          <label className={cn(dashboardSectionLabel, "mb-1.5 block")}>Storage (GB)</label>
          <input
            type="number"
            min={1}
            value={draft?.maxStorageGb ?? String(row.maxStorageGb)}
            disabled={!isEnterprise}
            onChange={(e) => onDraftChange({ maxStorageGb: e.target.value })}
            className={cn(TABLE_INPUT_CLASS, !isEnterprise && "cursor-not-allowed opacity-50")}
          />
          {!isEnterprise ? (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500">Fixed for this tier</p>
          ) : null}
        </div>

        <div className="flex items-end">
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={onSave}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-opacity sm:w-auto",
              dirty
                ? cn("text-white hover:opacity-90", dashboardAccentShadow)
                : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
            )}
            style={
              dirty
                ? {
                    background:
                      "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
                  }
                : undefined
            }
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save changes
          </button>
        </div>
      </div>
    </article>
  );
}

function MasterClientsSubscriptionView({
  rows,
  drafts,
  savingId,
  saveError,
  onDraftChange,
  onSave,
}: {
  rows: MasterClientRow[];
  drafts: Record<string, RowDraft>;
  savingId: string | null;
  saveError: string | null;
  onDraftChange: (clientId: string, patch: Partial<RowDraft>) => void;
  onSave: (clientId: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className={dashboardSectionLabel}>Administration</p>
        <h2 className={cn(dashboardPanelTitle, "mt-1")}>Client subscriptions</h2>
        <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-2xl")}>
          {rows.length} workspace{rows.length === 1 ? "" : "s"}. Adjust plan tier and limits per
          client — Starter and Growth use preset caps; Enterprise allows custom values.
        </p>
      </div>

      {saveError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {saveError}
        </div>
      ) : null}

      <div>
        {rows.map((row) => (
          <MasterClientCard
            key={row.clientId}
            row={row}
            draft={drafts[row.clientId]}
            saving={savingId === row.clientId}
            onDraftChange={(patch) => onDraftChange(row.clientId, patch)}
            onSave={() => onSave(row.clientId)}
          />
        ))}
      </div>
    </div>
  );
}

export default function PlanTab({ onOpenBilling }: { onOpenBilling?: () => void }) {
  const apiClient = getApiClient();
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminRole(user?.role);

  const [settings, setSettings] = useState<TenantSettingsData | null>(null);
  const [masterRows, setMasterRows] = useState<MasterClientRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const syncDrafts = useCallback((rows: MasterClientRow[]) => {
    const next: Record<string, RowDraft> = {};
    for (const row of rows) {
      next[row.clientId] = {
        subscriptionTier: row.subscriptionTier,
        maxPlayers: String(row.maxPlayers),
        maxStorageGb: String(row.maxStorageGb),
      };
    }
    setDrafts(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTenantPlan = async () => {
      const res = await apiClient.getTenantSettings();
      if (!cancelled) setSettings(res.settings);
    };

    const loadMasterPlan = async () => {
      const clientsRes = await apiClient.listClients();
      const clients: ClientInfo[] = (clientsRes?.clients || []).map((c: Record<string, unknown>) =>
        normalizeClient(c)
      );

      const workspaceTenant = apiClient.getEffectiveTenantId();
      const deviceCounts: Record<string, number> = {};

      await Promise.all(
        clients.map(async (client) => {
          if (!client.tenantId) {
            deviceCounts[client.id] = 0;
            return;
          }
          apiClient.setWorkspaceTenant(client.tenantId);
          try {
            const tenantRes = await apiClient.getTenantSettings();
            deviceCounts[client.id] = tenantRes.settings.usedPlayers ?? 0;
          } catch {
            deviceCounts[client.id] = 0;
          }
        })
      );

      if (workspaceTenant) {
        apiClient.setWorkspaceTenant(workspaceTenant);
      } else {
        apiClient.clearWorkspaceTenant();
      }

      const rows: MasterClientRow[] = clients.map((client) => ({
        clientId: client.id,
        workspaceName: client.name,
        tenantId: client.tenantId,
        subscriptionTier: client.subscriptionTier as SubscriptionTier,
        registeredDevices: deviceCounts[client.id] ?? 0,
        maxPlayers: client.maxPlayers,
        maxStorageGb: client.maxStorageGb,
      }));

      if (!cancelled) {
        setMasterRows(rows);
        syncDrafts(rows);
      }
    };

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (isSuperAdmin) {
          await loadMasterPlan();
        } else {
          await loadTenantPlan();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plan details");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiClient, isSuperAdmin, syncDrafts]);

  const handleDraftChange = (clientId: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => {
      const current = prev[clientId];
      if (!current) return prev;

      const nextTier = (patch.subscriptionTier ?? current.subscriptionTier) as SubscriptionTier;
      let maxPlayers = patch.maxPlayers ?? current.maxPlayers;
      let maxStorageGb = patch.maxStorageGb ?? current.maxStorageGb;

      if (patch.subscriptionTier && nextTier !== "ENTERPRISE") {
        const lock = TIER_LOCKS[nextTier];
        maxPlayers = String(lock.maxPlayers);
        maxStorageGb = String(lock.maxStorageGb);
      }

      return {
        ...prev,
        [clientId]: {
          subscriptionTier: nextTier,
          maxPlayers,
          maxStorageGb,
        },
      };
    });
  };

  const handleSave = async (clientId: string) => {
    const row = masterRows.find((r) => r.clientId === clientId);
    const draft = drafts[clientId];
    if (!row || !draft) return;

    const maxPlayers = Math.max(1, Number.parseInt(draft.maxPlayers, 10) || row.maxPlayers);
    const maxStorageGb = Math.max(1, Number.parseInt(draft.maxStorageGb, 10) || row.maxStorageGb);

    setSavingId(clientId);
    setSaveError(null);

    try {
      await apiClient.updateClient(clientId, {
        subscription_tier: draft.subscriptionTier,
        max_players: maxPlayers,
        max_storage_gb: maxStorageGb,
      });

      setMasterRows((prev) =>
        prev.map((r) =>
          r.clientId === clientId
            ? {
                ...r,
                subscriptionTier: draft.subscriptionTier,
                maxPlayers,
                maxStorageGb,
              }
            : r
        )
      );
    } catch (err) {
      const ax = err as { response?: { data?: { error?: string; detail?: { error?: string } } } };
      setSaveError(
        ax?.response?.data?.error ||
          ax?.response?.data?.detail?.error ||
          (err instanceof Error ? err.message : "Failed to update client subscription")
      );
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <PlanSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (isSuperAdmin) {
    if (masterRows.length === 0) {
      return (
        <div className="py-10 text-center">
          <HardDrive size={28} className="mx-auto text-gray-300 dark:text-zinc-600" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            No client workspaces found
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            Active clients will appear here for subscription management.
          </p>
        </div>
      );
    }

    return (
      <MasterClientsSubscriptionView
        rows={masterRows}
        drafts={drafts}
        savingId={savingId}
        saveError={saveError}
        onDraftChange={handleDraftChange}
        onSave={(clientId) => void handleSave(clientId)}
      />
    );
  }

  if (!settings) {
    return (
      <p className="text-sm text-gray-500 dark:text-zinc-400">No plan information available.</p>
    );
  }

  return <TenantPlanView settings={settings} onOpenBilling={onOpenBilling} />;
}
