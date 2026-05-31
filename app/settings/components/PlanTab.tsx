"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { TenantSettingsData } from "@/types/api";
import { cn } from "@/utils/cn";

const TIER_STYLES: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-800",
  PROFESSIONAL: "bg-purple-100 text-purple-800",
  ENTERPRISE: "bg-amber-100 text-amber-800",
};

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const atLimit = max > 0 && used >= max;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="text-gray-600">
          {used} / {max > 0 ? max : "—"}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            atLimit ? "bg-amber-500" : "bg-[#A473FF]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <p className="mt-1 text-xs text-amber-700">At or over plan limit</p>
      )}
    </div>
  );
}

export default function PlanTab() {
  const apiClient = getApiClient();
  const [settings, setSettings] = useState<TenantSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiClient.getTenantSettings();
        if (cancelled) return;
        setSettings(res.settings);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load plan details"
          );
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
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading plan…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (!settings) {
    return (
      <p className="text-sm text-gray-500">No plan information available.</p>
    );
  }

  const tier = (settings.subscriptionTier || settings.planName || "STARTER").toUpperCase();
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.STARTER;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current plan</h2>
            <p className="mt-1 text-sm text-gray-500">
              Subscription tier and resource usage for your tenant
            </p>
          </div>
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              tierStyle
            )}
          >
            {tier}
          </span>
        </div>

        {settings.planName && settings.planName.toUpperCase() !== tier && (
          <p className="mt-4 text-sm text-gray-600">
            Plan name: <span className="font-medium">{settings.planName}</span>
          </p>
        )}

        <div className="mt-8 space-y-6">
          <UsageBar
            label="Registered players"
            used={settings.usedPlayers}
            max={settings.maxPlayers}
          />
          <UsageBar
            label="Storage (GB)"
            used={settings.usedStorageGb}
            max={settings.maxStorageGb}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Usage is calculated from players and media stored in your tenant. Contact
        support to upgrade your tier or raise limits.
      </p>
    </div>
  );
}
