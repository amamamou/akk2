"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  Users,
  Cloud,
  TrendingUp,
  Loader2,
  Save,
} from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { ClientInfo, TenantSettingsData } from "@/types/api";
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

const TABLE_INPUT_CLASS =
  "w-full min-w-[5rem] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30 focus:border-[#A473FF] dark:bg-zinc-900/50 dark:border-zinc-700 dark:text-zinc-100";

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

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const atLimit = max > 0 && used >= max;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
        <span className="text-gray-600 dark:text-zinc-400">
          {used} / {max > 0 ? max : "—"}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atLimit ? "bg-amber-500" : "bg-[#A473FF]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">At or over plan limit</p>
      )}
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

function TenantPlanView({ settings }: { settings: TenantSettingsData }) {
  const tier = (settings.subscriptionTier || settings.planName || "STARTER").toUpperCase();

  return (
    <div className="max-w-8xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your plan</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            {settings.planName ? settings.planName : tier}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <CreditCard className="h-4 w-4 text-amber-500" /> Manage billing
          </button>
          <button
            type="button"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-[#A473FF] text-white rounded-md text-sm hover:bg-[#7A42FF]"
          >
            <TrendingUp className="h-4 w-4 transform transition-transform duration-200 group-hover:-translate-y-1" />
            Upgrade
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">What&apos;s included</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Player seats</div>
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                {settings.maxPlayers ?? "—"} seats included
              </div>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Cloud className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Storage</div>
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                {settings.maxStorageGb ?? "—"} GB storage
              </div>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-green-50 dark:bg-green-950/40 text-green-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Security & support</div>
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                Enterprise-grade security and priority support
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Billing & limits</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-amber-500" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Billing cycle</div>
              <div className="text-sm text-gray-500 dark:text-zinc-400">Monthly</div>
            </div>
          </div>
          <div className="text-sm text-gray-700 dark:text-zinc-300 font-medium">Contact sales</div>
        </div>

        <UsageBar label="Registered players" used={settings.usedPlayers} max={settings.maxPlayers} />
        <UsageBar label="Storage (GB)" used={settings.usedStorageGb} max={settings.maxStorageGb} />
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-500">
        Usage is calculated from players and media stored in your tenant. Contact
        support to upgrade your tier or raise limits.
      </p>
    </div>
  );
}

function MasterClientsSubscriptionTable({
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Master client subscriptions
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
          Platform-wide billing tiers, device allocations, and storage quotas.
        </p>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          {saveError}
        </div>
      )}

      <div className="rounded-lg border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                  Workspace
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                  Billing tier
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                  Registered devices
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                  Player limit
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                  Storage (GB)
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const draft = drafts[row.clientId];
                const tier = draft?.subscriptionTier ?? row.subscriptionTier;
                const isEnterprise = tier === "ENTERPRISE";

                return (
                  <tr
                    key={row.clientId}
                    className="border-b border-gray-50 dark:border-zinc-800/80 hover:bg-gray-50/80 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {row.workspaceName}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={tier}
                        onChange={(e) =>
                          onDraftChange(row.clientId, {
                            subscriptionTier: e.target.value as SubscriptionTier,
                          })
                        }
                        className={TABLE_INPUT_CLASS}
                      >
                        {SUBSCRIPTION_TIERS.map((t) => (
                          <option key={t} value={t}>
                            {TIER_LABELS[t] ?? t}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                        {row.workspaceName}: {TIER_LABELS[tier] ?? tier}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                      {row.registeredDevices}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={draft?.maxPlayers ?? String(row.maxPlayers)}
                        disabled={!isEnterprise}
                        onChange={(e) =>
                          onDraftChange(row.clientId, { maxPlayers: e.target.value })
                        }
                        className={cn(
                          TABLE_INPUT_CLASS,
                          !isEnterprise && "opacity-60 cursor-not-allowed"
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={draft?.maxStorageGb ?? String(row.maxStorageGb)}
                        disabled={!isEnterprise}
                        onChange={(e) =>
                          onDraftChange(row.clientId, { maxStorageGb: e.target.value })
                        }
                        className={cn(
                          TABLE_INPUT_CLASS,
                          !isEnterprise && "opacity-60 cursor-not-allowed"
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={savingId === row.clientId}
                        onClick={() => onSave(row.clientId)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#A473FF] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7A42FF] disabled:opacity-60"
                      >
                        {savingId === row.clientId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-500">
        Starter and Growth tiers use fixed allocation caps. Enterprise workspaces
        support custom player and storage overrides.
      </p>
    </div>
  );
}

export default function PlanTab() {
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
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (isSuperAdmin) {
    if (masterRows.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          No active client workspaces found.
        </p>
      );
    }

    return (
      <MasterClientsSubscriptionTable
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

  return <TenantPlanView settings={settings} />;
}
