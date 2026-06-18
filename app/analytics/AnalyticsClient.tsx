"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  fetchPlaybackLogs,
  fetchPlayers,
  fetchSystemHealth,
  fetchWorkspaceClientsBundle,
} from "@/lib/query-fetchers";
import { queryKeys } from "@/lib/query-keys";
import { isManagerRole, isSuperAdminRole } from "@/lib/rbac";
import type { PlayerInfo } from "@/types/api";
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
} from "@/lib/french-demo-seed";
import { type WorkspaceClientOption } from "@/lib/workspace-clients";
import { ANALYTICS_ALL_CLIENTS_ID } from "@/lib/global-admin-tenant";

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
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] = useState(
    ANALYTICS_ALL_CLIENTS_ID
  );
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const analyticsScopeAll =
    isSuperAdmin && selectedWorkspaceClientId === ANALYTICS_ALL_CLIENTS_ID;

  const workspaceClientsQuery = useQuery({
    queryKey: queryKeys.workspaceClients(),
    queryFn: fetchWorkspaceClientsBundle,
    enabled: isSuperAdmin,
    select: (data) => data.workspaceOptions,
  });

  const workspaceClients = useMemo(() => {
    if (!isSuperAdmin) return [] as WorkspaceClientOption[];
    if (workspaceClientsQuery.data?.length) return workspaceClientsQuery.data;
    return FRENCH_DEMO_ENTERPRISES.map((e) => ({
      id: e.clientId,
      name: e.name,
      tenantId: e.tenantId,
    }));
  }, [isSuperAdmin, workspaceClientsQuery.data]);

  const workspaceSelectOptions = useMemo((): WorkspaceClientOption[] => {
    if (!isSuperAdmin) return workspaceClients;
    return [
      { id: ANALYTICS_ALL_CLIENTS_ID, name: "All Clients", tenantId: "" },
      ...workspaceClients,
    ];
  }, [workspaceClients, isSuperAdmin]);

  const handleWorkspaceClientChange = useCallback(
    (clientId: string) => {
      if (clientId === ANALYTICS_ALL_CLIENTS_ID) {
        setSelectedWorkspaceClientId(ANALYTICS_ALL_CLIENTS_ID);
        setWorkspaceTenantId(null);
        setSelectedPlayerId("all");
        apiClient.clearWorkspaceTenant();
        return;
      }
      const match = workspaceClients.find((c) => c.id === clientId);
      if (!match) return;
      setSelectedWorkspaceClientId(match.id);
      setWorkspaceTenantId(match.tenantId);
      setSelectedPlayerId("all");
    },
    [apiClient, workspaceClients]
  );

  const activeAnalyticsTenantId = useMemo(() => {
    if (analyticsScopeAll) return sessionTenantId;
    if (isManager) return sessionTenantId;
    if (isSuperAdmin && workspaceTenantId) return workspaceTenantId;
    return sessionTenantId;
  }, [analyticsScopeAll, isManager, isSuperAdmin, workspaceTenantId, sessionTenantId]);

  const telemetryScope = analyticsScopeAll ? ("all" as const) : undefined;
  const telemetryScopeKey = telemetryScope ?? activeAnalyticsTenantId ?? "tenant";
  const telemetryEnabled =
    Boolean(activeAnalyticsTenantId) &&
    (!isSuperAdmin || Boolean(workspaceTenantId) || analyticsScopeAll);

  const applyAnalyticsTenantScope = useCallback(() => {
    if (analyticsScopeAll && sessionTenantId) {
      apiClient.setWorkspaceTenant(
        sessionTenantId,
        frenchDemoTenantSlug(sessionTenantId) ?? user?.tenantSlug
      );
      return;
    }
    if (activeAnalyticsTenantId) {
      apiClient.setWorkspaceTenant(
        activeAnalyticsTenantId,
        frenchDemoTenantSlug(activeAnalyticsTenantId) ?? user?.tenantSlug
      );
    }
  }, [
    analyticsScopeAll,
    sessionTenantId,
    activeAnalyticsTenantId,
    apiClient,
    user?.tenantSlug,
  ]);

  const healthQuery = useQuery({
    queryKey: queryKeys.systemHealth(telemetryScopeKey),
    queryFn: async () => {
      applyAnalyticsTenantScope();
      return fetchSystemHealth(telemetryScope);
    },
    enabled: telemetryEnabled,
  });

  const logsQuery = useQuery({
    queryKey: queryKeys.playbackLogs(telemetryScopeKey),
    queryFn: async () => {
      applyAnalyticsTenantScope();
      return fetchPlaybackLogs(200, telemetryScope);
    },
    enabled: telemetryEnabled,
  });

  const playersQuery = useQuery({
    queryKey: queryKeys.players(telemetryScopeKey),
    queryFn: async () => {
      applyAnalyticsTenantScope();
      return fetchPlayers(activeAnalyticsTenantId ?? undefined);
    },
    enabled: telemetryEnabled,
  });

  const tenantPlayerIds = useMemo(() => {
    if (analyticsScopeAll) {
      return new Set(
        FRENCH_DEMO_ENTERPRISES.flatMap((e) =>
          Array.from(frenchDemoPlayerIdsForTenant(e.tenantId))
        )
      );
    }
    return frenchDemoPlayerIdsForTenant(activeAnalyticsTenantId ?? "");
  }, [analyticsScopeAll, activeAnalyticsTenantId]);

  const shouldScope =
    !analyticsScopeAll && (isManager || Boolean(workspaceTenantId));

  const logs = useMemo(() => {
    const raw = logsQuery.data ?? [];
    return raw.filter((log) => {
      if (!shouldScope || tenantPlayerIds.size === 0) return true;
      return (
        tenantPlayerIds.has(log.playerId) ||
        Array.from(tenantPlayerIds).some(
          (id) => normalizePlayerId(id) === normalizePlayerId(log.playerId)
        )
      );
    });
  }, [logsQuery.data, shouldScope, tenantPlayerIds]);

  const players = useMemo(() => {
    const raw = playersQuery.data ?? [];
    return raw.filter((p) => {
      if (!shouldScope || tenantPlayerIds.size === 0) return true;
      return (
        tenantPlayerIds.has(p.id) ||
        Array.from(tenantPlayerIds).some(
          (id) => normalizePlayerId(id) === normalizePlayerId(p.id)
        )
      );
    });
  }, [playersQuery.data, shouldScope, tenantPlayerIds]);

  const health = healthQuery.data ?? null;
  const isLoading =
    healthQuery.isPending || logsQuery.isPending || playersQuery.isPending;
  const error =
    healthQuery.error || logsQuery.error || playersQuery.error
      ? String(
          (healthQuery.error as Error | undefined)?.message ||
            (logsQuery.error as Error | undefined)?.message ||
            (playersQuery.error as Error | undefined)?.message ||
            "Failed to load analytics"
        )
      : null;

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
    if (analyticsScopeAll) return null;
    if (!activeAnalyticsTenantId) return null;
    return frenchDemoPlayerIdsForTenant(activeAnalyticsTenantId);
  }, [activeAnalyticsTenantId, analyticsScopeAll]);

  const playerOptions = useMemo(() => {
    const byId = new Map<string, PlayerInfo>();

    if (analyticsScopeAll) {
      for (const [playerId, meta] of Object.entries(FRENCH_DEMO_PLAYER_REGISTRY)) {
        byId.set(playerId, {
          id: playerId,
          playerName: meta.name,
          roomName: meta.name,
          status: "online",
        } as PlayerInfo);
      }
    } else {
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
  }, [players, logs, activeAnalyticsTenantId, tenantScopedPlayerIds, analyticsScopeAll]);

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
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121214]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#121214]">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">Playback verification and listening metrics</p>
              </div>

              <div className="flex gap-2 items-center flex-wrap justify-end">
                {isSuperAdmin && workspaceSelectOptions.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedWorkspaceClientId}
                      onChange={(e) => handleWorkspaceClientChange(e.target.value)}
                      className="border border-violet-100 rounded-lg text-sm px-3 py-1.5 bg-violet-50 text-gray-900 dark:text-gray-100 outline-none focus:border-violet-200 appearance-none pr-8"
                      aria-label="Client workspace"
                    >
                      {workspaceSelectOptions.map((c) => (
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
                    className="border border-gray-100 dark:border-zinc-800 rounded-lg text-sm px-3 py-1.5 bg-white dark:bg-[#121214] text-gray-900 dark:text-gray-100 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
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
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900/60 rounded-lg border border-gray-100 dark:border-zinc-800 text-xs">
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
                    className="border border-gray-100 dark:border-zinc-800 rounded-lg text-sm px-3 py-1.5 bg-white dark:bg-[#121214] text-gray-900 dark:text-gray-100 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
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

        <div className="flex-1 overflow-auto bg-white dark:bg-[#121214]">
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
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121214]">
      <div className="sticky top-0 z-10 ] ">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">Playback verification and listening metrics</p>
            </div>

            <div className="flex gap-2 items-center flex-wrap justify-end">
              {isSuperAdmin && workspaceSelectOptions.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedWorkspaceClientId}
                    onChange={(e) => handleWorkspaceClientChange(e.target.value)}
                    className="border border-violet-100 rounded-lg text-sm px-3 py-1.5 bg-violet-50 text-gray-900 dark:text-gray-100 outline-none focus:border-violet-200 appearance-none pr-8"
                    aria-label="Client workspace"
                  >
                    {workspaceSelectOptions.map((c) => (
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
                  className="border border-gray-100 dark:border-zinc-800 rounded-lg text-sm px-3 py-1.5 bg-white dark:bg-[#121214] text-gray-900 dark:text-gray-100 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
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
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-900/60 rounded-lg border border-gray-100 dark:border-zinc-800 text-xs">
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
                  className="border border-gray-100 dark:border-zinc-800 rounded-lg text-sm px-3 py-1.5 bg-white dark:bg-[#121214] text-gray-900 dark:text-gray-100 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
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