"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Receipt,
  Repeat,
  X,
} from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { ClientInfo } from "@/types/api";
import { formatMoney, formatMoneyLabel } from "@/lib/format-currency";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import ModalFooterActions from "./ModalFooterActions";

const TIER_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Growth",
  ENTERPRISE: "Enterprise",
};

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function IssueInvoiceModal({
  open,
  client,
  onClose,
  onSuccess,
}: {
  open: boolean;
  client: ClientInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [status, setStatus] = useState<"UNPAID" | "PAID">("UNPAID");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    invoiceNumber: false,
    amount: false,
  });

  useEffect(() => {
    if (!open) return;
    setInvoiceNumber("");
    setAmount("");
    setDueDate(defaultDueDate());
    setStatus("UNPAID");
    setSubmitError(null);
    setTouched({ invoiceNumber: false, amount: false });
  }, [open, client?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  const parsedAmount = useMemo(() => {
    const n = Number.parseFloat(amount.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const invoiceNumberError =
    touched.invoiceNumber && !invoiceNumber.trim() ? "Invoice number is required" : null;
  const amountError =
    touched.amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)
      ? "Enter a valid amount greater than zero"
      : null;

  const canSubmit =
    Boolean(client?.tenantId) &&
    invoiceNumber.trim().length > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handleSubmit = async () => {
    if (!client?.tenantId) {
      setSubmitError("This client has no tenant linked. Cannot issue an invoice.");
      return;
    }

    setTouched({ invoiceNumber: true, amount: true });
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await getApiClient().createInvoice({
        tenantId: client.tenantId,
        invoiceNumber: invoiceNumber.trim(),
        amount: parsedAmount,
        status,
        dueDate: dueDate || null,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(
        ax?.response?.data?.error ||
          (err instanceof Error ? err.message : "Could not register invoice. Try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !client) return null;

  const tierLabel = TIER_LABELS[client.subscriptionTier] ?? client.subscriptionTier;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-invoice-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden sm:max-h-[90vh]",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn(dashboardIconChip, "h-8 w-8 rounded-lg")}>
                <Receipt size={15} className="text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <span className={dashboardSectionLabel}>Billing</span>
            </div>
            <h2 id="issue-invoice-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Issue invoice
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-md")}>
              Register a manual invoice for {client.name}. It appears in billing immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <p className={dashboardSectionLabel}>Client</p>
            <div
              className={cn(
                dashboardCardClass,
                "mt-3 flex items-center gap-3 border border-gray-100 p-4 dark:border-zinc-800"
              )}
            >
              <div className={cn(dashboardIconChip, "h-10 w-10 rounded-xl")}>
                <Building2 size={16} className="text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-zinc-100">{client.name}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{tierLabel} plan</p>
              </div>
            </div>
          </section>

          <section>
            <p className={dashboardSectionLabel}>Invoice details</p>
            <div className="mt-3 space-y-4">
              <div>
                <label htmlFor="invoice-number" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Invoice number
                </label>
                <input
                  id="invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, invoiceNumber: true }))}
                  placeholder="INV-2026-001"
                  className={INPUT_CLASS}
                  disabled={submitting}
                />
                {invoiceNumberError ? (
                  <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {invoiceNumberError}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="invoice-amount" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {formatMoneyLabel()}
                  </label>
                  <input
                    id="invoice-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                    placeholder="0.00"
                    className={INPUT_CLASS}
                    disabled={submitting}
                  />
                  {amountError ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {amountError}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="invoice-due-date" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Due date
                  </label>
                  <div className="relative mt-2">
                    <Calendar
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="invoice-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={cn(INPUT_CLASS, "mt-0 pl-10")}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Payment status</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("UNPAID")}
                    disabled={submitting}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      status === "UNPAID"
                        ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    )}
                  >
                    <Clock size={15} strokeWidth={2} />
                    Due
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("PAID")}
                    disabled={submitting}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      status === "PAID"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    )}
                  >
                    <CheckCircle2 size={15} strokeWidth={2} />
                    Paid
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className={dashboardSectionLabel}>Review</p>
            <div
              className={cn(
                dashboardCardClass,
                "mt-3 border border-gray-100 p-4 dark:border-zinc-800"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1 text-sm text-gray-600 dark:text-zinc-400">
                  <p>
                    <span className="text-gray-400 dark:text-zinc-500">Number:</span>{" "}
                    {invoiceNumber.trim() || "—"}
                  </p>
                  <p>
                    <span className="text-gray-400 dark:text-zinc-500">Status:</span>{" "}
                    {status === "PAID" ? "Paid" : "Due"}
                  </p>
                  {dueDate ? (
                    <p>
                      <span className="text-gray-400 dark:text-zinc-500">Due:</span> {dueDate}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Total</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
                    {Number.isFinite(parsedAmount) && parsedAmount > 0
                      ? formatMoney(parsedAmount)
                      : formatMoney(0)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {submitError ? (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{submitError}</p>
          ) : null}
          {!client.tenantId ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This client is missing a tenant ID. Link a tenant before issuing invoices.
            </p>
          ) : null}
        </div>

        <ModalFooterActions
          hint={
            <>
              <Repeat size={12} />
              Appears in client billing immediately
            </>
          }
          onCancel={onClose}
          cancelDisabled={submitting}
          primaryLabel="Invoice"
          primaryLoadingLabel="Issuing…"
          primaryIcon={<Receipt size={16} strokeWidth={2} />}
          onPrimary={() => void handleSubmit()}
          primaryDisabled={!canSubmit}
          primaryLoading={submitting}
        />
      </div>
    </div>
  );
}
