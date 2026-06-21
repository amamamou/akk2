"use client";

import React from "react";
import {
  HardDrive,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { ClientBillingSummary, ClientInfo } from "@/types/api";
import { formatMoney } from "@/lib/format-currency";
import {
  dashboardCardClass,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

const TIER_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Growth",
  ENTERPRISE: "Enterprise",
};

const STATUS_STYLES: Record<
  ClientInfo["status"],
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-500/30",
  },
  INACTIVE: {
    label: "Inactive",
    className:
      "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/30",
  },
  TRIAL: {
    label: "Trial",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-500/30",
  },
};

const TIER_STYLES: Record<string, string> = {
  STARTER:
    "bg-slate-50 text-slate-700 ring-slate-500/10 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600/30",
  PROFESSIONAL:
    "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-500/30",
  ENTERPRISE:
    "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-500/30",
};

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const CARD_ACTION_CLASS =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors";

const NEUTRAL_ACTION_CLASS =
  "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

export default function ClientCard({
  client,
  billing,
  onIssueInvoice,
  onEdit,
  onDelete,
}: {
  client: ClientInfo;
  billing?: ClientBillingSummary;
  onIssueInvoice: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const outstanding = billing?.outstandingBalance ?? 0;
  const paidTotal = billing?.paidTotal ?? 0;
  const totalInvoiced = billing?.totalInvoiced ?? 0;
  const statusStyle = STATUS_STYLES[client.status];
  const tierLabel = TIER_LABELS[client.subscriptionTier] ?? client.subscriptionTier;

  return (
    <article className={cn(dashboardCardClass, "flex flex-col overflow-hidden")}>
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
            }}
            aria-hidden
          >
            {clientInitials(client.name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-zinc-100">
              {client.name}
            </h3>
            {client.businessType ? (
              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-zinc-400">
                {client.businessType}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              statusStyle.className
            )}
          >
            {statusStyle.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              TIER_STYLES[client.subscriptionTier] ?? TIER_STYLES.STARTER
            )}
          >
            {tierLabel}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 px-5 py-4 dark:border-zinc-800">
        <p className={cn(dashboardSectionLabel, "mb-3")}>Billing snapshot</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Outstanding</p>
            <p
              className={cn(
                "mt-1 text-sm font-semibold tabular-nums",
                outstanding > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-zinc-100"
              )}
            >
              {formatMoney(outstanding)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Paid</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
              {formatMoney(paidTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Invoiced</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
              {formatMoney(totalInvoiced)}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} className="shrink-0 opacity-60" />
            {client.maxPlayers} players
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HardDrive size={12} className="shrink-0 opacity-60" />
            {client.maxStorageGb} GB
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
          {client.contactPerson ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <UserRound size={12} className="shrink-0 opacity-60" />
              <span className="truncate">{client.contactPerson}</span>
            </span>
          ) : null}
          {client.email ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail size={12} className="shrink-0 opacity-60" />
              <span className="truncate">{client.email}</span>
            </span>
          ) : null}
          {client.phone ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Phone size={12} className="shrink-0 opacity-60" />
              <span className="truncate">{client.phone}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className={cn(CARD_ACTION_CLASS, NEUTRAL_ACTION_CLASS)}
          >
            <Pencil size={13} strokeWidth={2} />
            Edit
          </button>
          <button
            type="button"
            onClick={onIssueInvoice}
            title="Issue invoice for this client"
            className={cn(CARD_ACTION_CLASS, NEUTRAL_ACTION_CLASS)}
          >
            <Receipt size={13} strokeWidth={2} />
            Invoice
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              CARD_ACTION_CLASS,
              "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
            )}
          >
            <Trash2 size={13} strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
