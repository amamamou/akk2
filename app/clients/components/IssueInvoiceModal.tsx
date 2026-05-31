"use client";

import React, { useState } from "react";
import AdminAddModal from "@/app/admin/components/AdminAddModal";
import { getApiClient } from "@/lib/api-client";
import type { ClientInfo } from "@/types/api";

type Props = {
  open: boolean;
  client: ClientInfo | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function IssueInvoiceModal({
  open,
  client,
  onClose,
  onSuccess,
}: Props) {
  const apiClient = getApiClient();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"UNPAID" | "PAID">("UNPAID");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = client?.tenantId;

  const handleSave = async () => {
    if (!client || !tenantId) {
      setError("This client has no linked tenant. Re-create the client or run migration 006.");
      return;
    }
    const num = parseFloat(amount);
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required.");
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient.createInvoice({
        tenantId,
        invoiceNumber: invoiceNumber.trim(),
        amount: num,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setInvoiceNumber("");
      setAmount("");
      setDueDate("");
      setStatus("UNPAID");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: { error?: string } | string } } };
      const detail = ax?.response?.data?.detail;
      const msg =
        typeof detail === "object" && detail?.error
          ? detail.error
          : typeof detail === "string"
            ? detail
            : err instanceof Error
              ? err.message
              : "Failed to create invoice";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAddModal
      open={open}
      onClose={onClose}
      title={client ? `Issue invoice — ${client.name}` : "Issue invoice"}
      onSave={handleSave}
      saveDisabled={loading || !tenantId}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {!tenantId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No tenant is linked to this client. Invoicing requires a tenant_id on the client
            record.
          </div>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Invoice number
          </span>
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-2026-001"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Amount (EUR)
          </span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="99.00"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "UNPAID" | "PAID")}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="UNPAID">UNPAID</option>
            <option value="PAID">PAID</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Due date (optional)
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
      </div>
    </AdminAddModal>
  );
}
