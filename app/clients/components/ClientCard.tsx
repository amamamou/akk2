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

const STATUS_LABELS: Record<ClientInfo["status"], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  TRIAL: "Trial",
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
  const statusLabel = STATUS_LABELS[client.status];
  const tierLabel = TIER_LABELS[client.subscriptionTier] ?? client.subscriptionTier;

  return (
    <article className={cn(dashboardCardClass, "flex flex-col overflow-hidden")}>
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-medium text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-400"
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
            <p className="mt-1 text-xs text-gray-400">
              {statusLabel} · {tierLabel}
            </p>
          </div>
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
