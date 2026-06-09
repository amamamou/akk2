"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, CalendarCheck, ShieldCheck, Users, Cloud, TrendingUp } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { TenantSettingsData } from "@/types/api";
import { cn } from "@/utils/cn";


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
      <div className="space-y-6">
        {/* Hero skeleton (simple) */}
        <div className="animate-pulse">
          <div className="h-6 w-1/3 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
        </div>

        {/* Features skeleton (stacked) */}
        <div className="space-y-4">
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>

        {/* Billing skeleton (stacked) */}
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
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

  return (
    <div className="max-w-8xl space-y-6">
      {/* Hero (simple, no card) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your plan</h2>
          <p className="mt-1 text-sm text-gray-600">{settings.planName ? settings.planName : tier}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            <CreditCard className="h-4 w-4 text-amber-500" /> Manage billing
          </button>
          <button className="group inline-flex items-center gap-2 px-4 py-2 bg-[#A473FF] text-white rounded-md text-sm hover:bg-[#7A42FF]">
            <TrendingUp className="h-4 w-4 transform transition-transform duration-200 group-hover:-translate-y-1" />
            Upgrade
          </button>
        </div>
      </div>

      {/* Features (stacked) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">What&apos;s included</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-amber-50 text-amber-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Player seats</div>
              <div className="text-sm text-gray-500">{settings.maxPlayers ?? "—"} seats included</div>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-50 text-purple-600">
              <Cloud className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Storage</div>
              <div className="text-sm text-gray-500">{settings.maxStorageGb ?? "—"} GB storage</div>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-green-50 text-green-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Security & support</div>
              <div className="text-sm text-gray-500">Enterprise-grade security and priority support</div>
            </div>
          </li>
        </ul>
      </div>

      {/* Billing & limits (stacked) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Billing & limits</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-amber-500" />
            <div>
              <div className="font-medium text-gray-900">Billing cycle</div>
              <div className="text-sm text-gray-500">Monthly</div>
            </div>
          </div>
          <div className="text-sm text-gray-700 font-medium">Contact sales</div>
        </div>

        <UsageBar label="Registered players" used={settings.usedPlayers} max={settings.maxPlayers} />
        <UsageBar label="Storage (GB)" used={settings.usedStorageGb} max={settings.maxStorageGb} />
      </div>

      <p className="text-xs text-gray-500">
        Usage is calculated from players and media stored in your tenant. Contact
        support to upgrade your tier or raise limits.
      </p>
    </div>
  );
}
