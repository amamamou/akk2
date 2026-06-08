"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import { isManagerRole, isSuperAdminRole } from "@/lib/rbac";
import type {
  PlaybackLogEntry,
  PlayerInfo,
  SystemHealthMetrics,
} from "@/types/api";
import {
  buildEngagementData,
  buildHourlyTrafficFromLogs,
  buildListenerSegmentationFromLogs,
  filterLogsByPlayerId,
  heartbeatRateFromLogs,
  isEngagementTier,
  normalizePlayerId,
  tierDisplayLabel,
  type ListenerSegmentation,
} from "@/lib/analytics-metrics";
import {
  FRENCH_DEMO_ENTERPRISES,
  FRENCH_DEMO_PLAYER_REGISTRY,
  frenchDemoMediaTitle,
  frenchDemoPlayerIdsForTenant,
  frenchDemoPlayerName,
  frenchDemoTenantSlug,
  mergeEnterpriseWorkspaceClients,
} from "@/lib/french-demo-seed";
import {
  toActiveWorkspaceClients,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";

import KpiGrid from "./components/KpiGrid";
import ChartsPanel from "./components/ChartsPanel";
import PlaybackTable from "./components/PlaybackTable";

type TimeRange = "today" | "7d" | "month";

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatLogTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function logIconForStatus(status: string) {
  const s = status.toUpperCase();
  if (s === "DEEP" || s === "ENGAGED") return CheckCircle;
  if (s === "LIGHT") return AlertCircle;
  if (s === "MODERATE") return PlayCircle;
  if (s === "COMPLETED") return CheckCircle;
  if (s === "FAILED") return AlertCircle;
  return PlayCircle;
}

function tierChipClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "DEEP") return "bg-violet-100 text-violet-800";
  if (s === "ENGAGED") return "bg-emerald-100 text-emerald-700";
  if (s === "MODERATE") return "bg-blue-50 text-blue-700";
  if (s === "LIGHT") return "bg-amber-50 text-amber-800";
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (s === "FAILED") return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default function AnalyticsClient() {
  const apiClient = getApiClient();
  const { user } = useAuth();
  const isManager = isManagerRole(user?.role);
  const isSuperAdmin = isSuperAdminRole(user?.role);
  const sessionTenantId =
    user?.tenantId || apiClient.getTenantId() || apiClient.getEffectiveTenantId();
  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>([]);
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] = useState("");
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [logs, setLogs] = useState<PlaybackLogEntry[]>([]);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const activeAnalyticsTenantId = useMemo(() => {
    if (isManager) return sessionTenantId;
    if (isSuperAdmin && workspaceTenantId) return workspaceTenantId;
    return sessionTenantId;
  }, [isManager, isSuperAdmin, workspaceTenantId, sessionTenantId]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.listClients();
        if (cancelled) return;
        const merged = mergeEnterpriseWorkspaceClients(
          toActiveWorkspaceClients(res?.clients ?? [])
        );
        setWorkspaceClients(merged);
        if (!selectedWorkspaceClientId && merged.length > 0) {
          const preferred =
            merged.find((c) => c.tenantId === FRENCH_DEMO_ENTERPRISES[0]?.tenantId) ??
            merged[0];
          setSelectedWorkspaceClientId(preferred.id);
          setWorkspaceTenantId(preferred.tenantId);
        }
      } catch {
        if (cancelled) return;
        const fallback = FRENCH_DEMO_ENTERPRISES.map((e) => ({
          id: e.clientId,
          name: e.name,
          tenantId: e.tenantId,
        }));
        setWorkspaceClients(fallback);
        if (fallback[0]) {
          setSelectedWorkspaceClientId(fallback[0].id);
          setWorkspaceTenantId(fallback[0].tenantId);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiClient, isSuperAdmin, selectedWorkspaceClientId]);

  useEffect(() => {
    let cancelled = false;

    const tenantForFetch = activeAnalyticsTenantId;
    if (!tenantForFetch || (isSuperAdmin && !workspaceTenantId)) {
      setIsLoading(false);
      return;
    }

    apiClient.setWorkspaceTenant(
      tenantForFetch,
      frenchDemoTenantSlug(tenantForFetch) ?? user?.tenantSlug
    );

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [healthRes, logsRes, playersRes] = await Promise.all([
          apiClient.getSystemHealth(),
          apiClient.getPlaybackLogs(200),
          apiClient.listPlayers().catch(() => ({ ok: false, players: [] as PlayerInfo[] })),
        ]);
        if (cancelled) return;

        const tenantPlayerIds = frenchDemoPlayerIdsForTenant(tenantForFetch);
        const shouldScope = isManager || Boolean(activeAnalyticsTenantId);

        const scopedLogs = (logsRes.logs ?? []).filter((log) => {
          if (!shouldScope || tenantPlayerIds.size === 0) return true;
          return (
            tenantPlayerIds.has(log.playerId) ||
            Array.from(tenantPlayerIds).some(
              (id) => normalizePlayerId(id) === normalizePlayerId(log.playerId)
            )
          );
        });

        const scopedPlayers = (playersRes.players ?? []).filter((p) => {
          if (!shouldScope || tenantPlayerIds.size === 0) return true;
          return (
            tenantPlayerIds.has(p.id) ||
            Array.from(tenantPlayerIds).some(
              (id) => normalizePlayerId(id) === normalizePlayerId(p.id)
            )
          );
        });

        setHealth(healthRes);
        setLogs(scopedLogs);
        setPlayers(scopedPlayers);
      } catch (err: unknown) {
        if (!cancelled) {
          const ax = err as { response?: { data?: { error?: string } }; message?: string };
          setError(ax?.response?.data?.error || ax?.message || "Failed to load analytics");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (isManager || isSuperAdmin) {
        apiClient.clearWorkspaceTenant();
      }
    };
  }, [
    apiClient,
    isManager,
    isSuperAdmin,
    activeAnalyticsTenantId,
    user?.tenantSlug,
    workspaceTenantId,
  ]);

  const resolveDeviceLabel = useCallback(
    (playerId: string | null | undefined, apiName?: string | null) => {
      const seedName = frenchDemoPlayerName(playerId);
      if (seedName) return seedName;
      if (apiName?.trim()) return apiName.trim();
      const fromApi = players.find(
        (p) => normalizePlayerId(p.id) === normalizePlayerId(playerId)
      );
      return fromApi?.roomName || fromApi?.playerName || playerId || "Unknown device";
    },
    [players]
  );

  const resolveMediaLabel = useCallback(
    (mediaId: string | null | undefined, apiTitle?: string | null) => {
      return (
        apiTitle?.trim() ||
        frenchDemoMediaTitle(mediaId) ||
        "Unknown media"
      );
    },
    []
  );

  const tenantScopedPlayerIds = useMemo(() => {
    if (!activeAnalyticsTenantId) return null;
    return frenchDemoPlayerIdsForTenant(activeAnalyticsTenantId);
  }, [activeAnalyticsTenantId]);

  const playerOptions = useMemo(() => {
    const byId = new Map<string, PlayerInfo>();
    const scopeTenant = activeAnalyticsTenantId;

    if (scopeTenant) {
      for (const [playerId, meta] of Object.entries(FRENCH_DEMO_PLAYER_REGISTRY)) {
        if (meta.tenantId !== scopeTenant) continue;
        byId.set(playerId, {
          id: playerId,
          playerName: meta.name,
          roomName: meta.name,
          status: "online",
        } as PlayerInfo);
      }
    }

    for (const p of players) {
      if (!p.id) continue;
      if (
        tenantScopedPlayerIds &&
        !tenantScopedPlayerIds.has(p.id) &&
        !Array.from(tenantScopedPlayerIds).some(
          (id) => normalizePlayerId(id) === normalizePlayerId(p.id)
        )
      ) {
        continue;
      }
      byId.set(p.id, p);
    }

    for (const log of logs) {
      if (!log.playerId || byId.has(log.playerId)) continue;
      if (
        tenantScopedPlayerIds &&
        !tenantScopedPlayerIds.has(log.playerId) &&
        !Array.from(tenantScopedPlayerIds).some(
          (id) => normalizePlayerId(id) === normalizePlayerId(log.playerId)
        )
      ) {
        continue;
      }
      const seedName = frenchDemoPlayerName(log.playerId);
      byId.set(log.playerId, {
        id: log.playerId,
        playerName: seedName ?? log.playerName ?? log.playerId,
        roomName: seedName ?? log.playerName ?? undefined,
        status: "online",
      } as PlayerInfo);
    }

    return Array.from(byId.values()).sort((a, b) =>
      (a.roomName || a.playerName || "").localeCompare(b.roomName || b.playerName || "")
    );
  }, [players, logs, activeAnalyticsTenantId, tenantScopedPlayerIds]);

  const filteredLogs = useMemo(() => {
    let rows = filterLogsByPlayerId(logs, selectedPlayerId);

    if (isManager && playerOptions.length > 0) {
      const allowed = new Set(
        playerOptions.map((p) => normalizePlayerId(p.id))
      );
      rows = rows.filter((log) =>
        allowed.has(normalizePlayerId(log.playerId))
      );
    }

    const now = Date.now();
    const cutoffs: Record<TimeRange, number> = {
      today: now - 24 * 60 * 60 * 1000,
      "7d": now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };
    const cut = cutoffs[timeRange];
    return rows.filter((l) => {
      const ts = new Date(l.createdAt || l.startedAt || 0).getTime();
      return !Number.isNaN(ts) && ts >= cut;
    });
  }, [logs, selectedPlayerId, timeRange, isManager, playerOptions]);

  const heartbeatRate = useMemo(() => {
    if (filteredLogs.length > 0) return heartbeatRateFromLogs(filteredLogs);
    return health?.heartbeatSuccessRate ?? 0;
  }, [filteredLogs, health]);

  const segmentation: ListenerSegmentation = useMemo(
    () => buildListenerSegmentationFromLogs(filteredLogs, heartbeatRate),
    [filteredLogs, heartbeatRate]
  );

  const engagementData = useMemo(
    () => buildEngagementData(segmentation),
    [segmentation]
  );

  const hourlyTraffic = useMemo(
    () => buildHourlyTrafficFromLogs(filteredLogs),
    [filteredLogs]
  );

  const selectedPlayerMeta = useMemo(() => {
    if (selectedPlayerId === "all") {
      return { status: "online" as const, device: "All devices", lastActive: "Live" };
    }
    const p = playerOptions.find((x) => x.id === selectedPlayerId);
    return {
      status: (p?.status === "online" ? "online" : "offline") as "online" | "offline",
      device: p?.playerName || p?.roomName || "Player",
      lastActive: p?.lastSeen ? "Recent" : "Unknown",
    };
  }, [selectedPlayerId, playerOptions]);

  const kpiCards = useMemo(() => {
    const seg = segmentation;
    const total = Math.max(seg.totalListeners, 1);
    return [
      {
        title: "Total Listeners",
        value: seg.totalListeners.toLocaleString(),
        icon: Users,
        trend: seg.engagementTrend,
        meta: `Retention: ${seg.retentionRate}`,
      },
      {
        title: "Engaged Listeners",
        value: seg.engagedListeners.toLocaleString(),
        icon: Activity,
        trend: `${((seg.engagedListeners / total) * 100).toFixed(1)}%`,
        meta: "Of operational devices",
      },
      {
        title: "Light Listeners",
        value: seg.lightListeners.toLocaleString(),
        icon: Clock,
        trend: `${((seg.lightListeners / total) * 100).toFixed(1)}%`,
        meta: "Short / failed sessions",
      },
      {
        title: "Moderate Listeners",
        value: seg.moderateListeners.toLocaleString(),
        icon: TrendingUp,
        trend: `${((seg.moderateListeners / total) * 100).toFixed(1)}%`,
        meta: "Regular listeners",
      },
      {
        title: "Deep Listeners",
        value: seg.deepListeners.toLocaleString(),
        icon: CheckCircle,
        trend: `${((seg.deepListeners / total) * 100).toFixed(1)}%`,
        meta: "Highest engagement",
      },
    ];
  }, [segmentation]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F4F5]">
        <div className="sticky top-0 z-10 bg-[#F4F4F5]">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">Playback verification and listening metrics</p>
              </div>

              <div className="flex gap-2 items-center flex-wrap justify-end">
                {isSuperAdmin && workspaceClients.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedWorkspaceClientId}
                      onChange={(e) => {
                        const match = workspaceClients.find((c) => c.id === e.target.value);
                        if (!match) return;
                        setSelectedWorkspaceClientId(match.id);
                        setWorkspaceTenantId(match.tenantId);
                        setSelectedPlayerId("all");
                      }}
                      className="border border-violet-100 rounded-lg text-sm px-3 py-1.5 bg-violet-50 text-gray-900 outline-none focus:border-violet-200 appearance-none pr-8"
                      aria-label="Client workspace"
                    >
                      {workspaceClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                    />
                  </div>
                )}
                <div className="relative">
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
                  >
                    <option value="all">All Players</option>
                    {playerOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {resolveDeviceLabel(p.id, p.roomName || p.playerName)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>

                {selectedPlayerId !== "all" && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                    <div
                      className={cn(
                        "w-1 h-1 rounded-full",
                        selectedPlayerMeta.status === "online" ? "bg-green-600" : "bg-gray-400"
                      )}
                    />
                    <span className="text-gray-600 font-medium">
                      {selectedPlayerMeta.status === "online" ? "Online" : "Offline"}
                    </span>
                    <span className="text-gray-300 mx-0.5">•</span>
                    <span className="text-gray-500">{selectedPlayerMeta.device}</span>
                  </div>
                )}

                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                    className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
                  >
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="month">This Month</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#F4F4F5]">
          <div className="px-6 py-6">
            {/* Quick stats skeleton row */}
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
                <div className="h-20 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                <div className="h-20 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                <div className="h-20 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                <div className="h-20 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
              </div>
            </div>

            {/* Skeleton / wireframe grid */}
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                  <div className="h-40 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                  <div className="h-60 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                </div>

                <div className="space-y-6">
                  <div className="h-24 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                  <div className="h-40 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                  <div className="h-20 bg-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200" aria-hidden="true" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F4F5]">
      <div className="sticky top-0 z-10 ] ">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">Playback verification and listening metrics</p>
            </div>

            <div className="flex gap-2 items-center flex-wrap justify-end">
              {isSuperAdmin && workspaceClients.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedWorkspaceClientId}
                    onChange={(e) => {
                      const match = workspaceClients.find((c) => c.id === e.target.value);
                      if (!match) return;
                      setSelectedWorkspaceClientId(match.id);
                      setWorkspaceTenantId(match.tenantId);
                      setSelectedPlayerId("all");
                    }}
                    className="border border-violet-100 rounded-lg text-sm px-3 py-1.5 bg-violet-50 text-gray-900 outline-none focus:border-violet-200 appearance-none pr-8"
                    aria-label="Client workspace"
                  >
                    {workspaceClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>
              )}
              <div className="relative">
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
                >
                  <option value="all">All Players</option>
                  {playerOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {resolveDeviceLabel(p.id, p.roomName || p.playerName)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                />
              </div>

              {selectedPlayerId !== "all" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full",
                      selectedPlayerMeta.status === "online" ? "bg-green-600" : "bg-gray-400"
                    )}
                  />
                  <span className="text-gray-600 font-medium">
                    {selectedPlayerMeta.status === "online" ? "Online" : "Offline"}
                  </span>
                  <span className="text-gray-300 mx-0.5">•</span>
                  <span className="text-gray-500">{selectedPlayerMeta.device}</span>
                </div>
              )}

              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6 space-y-6">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Removed the global 'No playback logs returned' banner so the page shows KPIs/charts immediately.
              The PlaybackTable already renders a contextual 'No playback logs for this filter.' row when appropriate. */}

          <KpiGrid stats={kpiCards} />

          <ChartsPanel engagementData={engagementData} hourlyTraffic={hourlyTraffic} />

          <PlaybackTable
            filteredLogs={filteredLogs}
            resolveMediaLabel={resolveMediaLabel}
            resolveDeviceLabel={resolveDeviceLabel}
            logIconForStatus={logIconForStatus}
            isEngagementTier={isEngagementTier}
            tierDisplayLabel={tierDisplayLabel}
            tierChipClass={tierChipClass}
            formatDuration={formatDuration}
            formatLogTime={formatLogTime}
          />
        </div>
      </div>
    </div>
  );
}