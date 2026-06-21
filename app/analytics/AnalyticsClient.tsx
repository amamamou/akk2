"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
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
  dashboardContainerClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
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
import AnalyticsHero from "./components/AnalyticsHero";
import AnalyticsToolbar from "./components/AnalyticsToolbar";
import AnalyticsPageSkeleton from "./components/AnalyticsPageSkeleton";

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

  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        <AnalyticsHero timeRange={timeRange} onTimeRangeChange={setTimeRange} />

        <AnalyticsToolbar
          isSuperAdmin={isSuperAdmin}
          workspaceSelectOptions={workspaceSelectOptions}
          selectedWorkspaceClientId={selectedWorkspaceClientId}
          onWorkspaceClientChange={handleWorkspaceClientChange}
          selectedPlayerId={selectedPlayerId}
          onPlayerChange={setSelectedPlayerId}
          playerOptions={playerOptions}
          resolveDeviceLabel={resolveDeviceLabel}
          selectedPlayerMeta={selectedPlayerMeta}
        />

        {isLoading ? (
          <AnalyticsPageSkeleton />
        ) : (
          <>
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}