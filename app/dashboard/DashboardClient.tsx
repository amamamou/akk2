/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/context/AuthContext";
import { isSuperAdminRole } from "@/lib/rbac";
import {
  fetchDashboardActivity,
  fetchMedia,
  fetchPlaybackLogs,
  fetchPlayers,
  fetchSchedules,
  fetchSystemHealth,
  fetchWorkspaceClientsBundle,
} from "@/lib/query-fetchers";
import { buildBroadcastActivitySummary } from "@/lib/broadcast-activity";
import {
  buildActivityTimeline,
  buildAudioInsights,
  buildLivePlayerRows,
  buildLiveSummary,
  buildOperationalOverview,
  buildPlayerInsights,
  buildScheduleSnapshot,
  buildSystemAlerts,
  buildVenueInsights,
} from "@/lib/dashboard-insights";
import { queryKeys } from "@/lib/query-keys";

import DashboardHero from "./components/DashboardHero";
import DashboardSkeleton from "./components/DashboardSkeleton";
import OperationalMetricsStrip from "./components/OperationalMetricsStrip";
import BroadcastActivity from "./components/BroadcastActivity";
import OperationsOverview from "./components/OperationsOverview";
import LiveOperations from "./components/LiveOperations";
import VenueInsights from "./components/VenueInsights";
import ActivityTimeline from "./components/ActivityTimeline";
import ScheduleSnapshot from "./components/ScheduleSnapshot";
import PlayerInsights from "./components/PlayerInsights";
import AudioInsights from "./components/AudioInsights";
import { dashboardContainerClass, dashboardCommandLayout, dashboardHalfRow, dashboardMainColumn, dashboardPageClass, dashboardSidebarColumn } from "./dashboard-styles";

export default function DashboardClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminRole(user?.role);

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchPlayers(),
    refetchInterval: 30_000,
  });

  const mediaQuery = useQuery({
    queryKey: queryKeys.media(),
    queryFn: () => fetchMedia(),
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules(),
    queryFn: () => fetchSchedules(),
  });

  const clientsQuery = useQuery({
    queryKey: queryKeys.workspaceClients(),
    queryFn: fetchWorkspaceClientsBundle,
    enabled: isSuperAdmin,
    select: (data) => data.clients,
  });

  const healthQuery = useQuery({
    queryKey: queryKeys.systemHealth(),
    queryFn: () => fetchSystemHealth(),
  });

  const activityQuery = useQuery({
    queryKey: queryKeys.dashboardActivity(),
    queryFn: () => fetchDashboardActivity(),
  });

  const playbackLogsQuery = useQuery({
    queryKey: queryKeys.playbackLogs(undefined, 500),
    queryFn: () => fetchPlaybackLogs(500),
  });

  const players = playersQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const media = mediaQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const systemHealth = healthQuery.data ?? null;
  const activityLogs = activityQuery.data ?? [];
  const playbackLogs = playbackLogsQuery.data ?? [];

  const isLoading =
    playersQuery.isPending ||
    mediaQuery.isPending ||
    schedulesQuery.isPending ||
    healthQuery.isPending ||
    activityQuery.isPending ||
    playbackLogsQuery.isPending;

  const error =
    playersQuery.error ||
    schedulesQuery.error ||
    healthQuery.error ||
    activityQuery.error
      ? String(
          (playersQuery.error as Error | undefined)?.message ||
            (schedulesQuery.error as Error | undefined)?.message ||
            (healthQuery.error as Error | undefined)?.message ||
            (activityQuery.error as Error | undefined)?.message ||
            "Failed to load dashboard data"
        )
      : null;

  useEffect(() => {
    const onPlayersUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.players() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActivity() });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("akou:players-updated", onPlayersUpdated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("akou:players-updated", onPlayersUpdated);
      }
    };
  }, [queryClient]);

  const clientsCount = isSuperAdmin ? clients.length : 1;

  const overview = useMemo(
    () =>
      buildOperationalOverview(schedules, players, clientsCount, systemHealth, playbackLogs),
    [schedules, players, clientsCount, systemHealth, playbackLogs]
  );

  const broadcastActivity = useMemo(
    () =>
      buildBroadcastActivitySummary(
        activityLogs,
        schedules,
        playbackLogs,
        players,
        systemHealth?.heartbeatSuccessRate
      ),
    [activityLogs, schedules, playbackLogs, players, systemHealth?.heartbeatSuccessRate]
  );

  const livePlayers = useMemo(() => buildLivePlayerRows(players), [players]);
  const venueInsights = useMemo(
    () => buildVenueInsights(players, playbackLogs),
    [players, playbackLogs]
  );
  const activityTimeline = useMemo(
    () => buildActivityTimeline(activityLogs, players, media, schedules),
    [activityLogs, players, media, schedules]
  );
  const scheduleSnapshot = useMemo(
    () => buildScheduleSnapshot(schedules, players),
    [schedules, players]
  );
  const playerInsights = useMemo(
    () => buildPlayerInsights(players, playbackLogs),
    [players, playbackLogs]
  );
  const audioInsights = useMemo(
    () => buildAudioInsights(media, schedules, playbackLogs),
    [media, schedules, playbackLogs]
  );
  const systemAlerts = useMemo(
    () => buildSystemAlerts(systemHealth, players, playbackLogs),
    [systemHealth, players, playbackLogs]
  );

  const liveSummary = useMemo(
    () => buildLiveSummary(players, systemHealth, playbackLogs),
    [players, systemHealth, playbackLogs]
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <DashboardHero players={players} schedules={schedules} media={media} />

        <OperationalMetricsStrip overview={overview} />

        <div className={dashboardCommandLayout}>
          <div className={dashboardMainColumn}>
            <BroadcastActivity summary={broadcastActivity} />
            <LiveOperations players={livePlayers} />
            <ActivityTimeline activities={activityTimeline} />
          </div>

          <aside className={dashboardSidebarColumn}>
            <OperationsOverview
              alerts={systemAlerts}
              liveSummary={liveSummary}
              upcoming={scheduleSnapshot}
            />
            <ScheduleSnapshot items={scheduleSnapshot} />
            <VenueInsights venues={venueInsights} />
          </aside>
        </div>

        <div className={dashboardHalfRow}>
          <PlayerInsights data={playerInsights} />
          <AudioInsights data={audioInsights} />
        </div>
      </div>
    </div>
  );
}
