"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { InvoiceInfo } from "@/types/api";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/lib/format-currency";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BillingTab() {
  const apiClient = getApiClient();
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
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
        const res = await apiClient.listInvoices();
        if (!cancelled) setInvoices(res.invoices ?? []);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            (err instanceof Error ? err.message : "Failed to load invoices");
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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-32" />
                </th>
                <th className="text-left px-4 py-3">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-20" />
                </th>
                <th className="text-left px-4 py-3">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
                </th>
                <th className="text-left px-4 py-3">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
                </th>
                <th className="text-left px-4 py-3">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-16" />
                </th>
              </tr>
            </thead>
            <tbody className="animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-zinc-800/80">
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-12" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
        {error}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No invoices yet</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Manual invoices for your tenant will appear here once registered.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-100 dark:border-zinc-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                Invoice #
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                Amount
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                Due date
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                Download
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-gray-50 dark:border-zinc-800/80 hover:bg-gray-50/80 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">{formatMoney(invoice.amount)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
                      invoice.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  {invoice.downloadUrl ? (
                    <a
                      href={invoice.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#6B46FF] hover:underline text-xs font-medium"
                    >
                      PDF
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-zinc-500 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
