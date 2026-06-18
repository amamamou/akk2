/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "./components/DashboardHeader";
import LivePlayerStatus, { type PlayerStatus } from "./components/LivePlayerStatus";
import RecentActivityFeed, { type ActivityItem } from "./components/RecentActivityFeed";
import UpcomingBroadcasts, { type Broadcast } from "./components/UpcomingBroadcasts";
import QuickActions from "./components/QuickActions";
import SystemAlerts from "./components/SystemAlerts";
import { useAuth } from "@/app/context/AuthContext";
import { isSuperAdminRole } from "@/lib/rbac";
import { getApiClient } from "@/lib/api-client";
import {
  fetchDashboardActivity,
  fetchMedia,
  fetchPlayers,
  fetchSchedules,
  fetchSystemHealth,
} from "@/lib/query-fetchers";
import { queryKeys } from "@/lib/query-keys";
import type { PlayerInfo, ScheduleEntry, ActivityLogEntry } from "@/types/api";
import type { QuickStat } from "./components/QuickStatsGrid";

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const timeLabel = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function relativeTime(input: string) {
  const date = new Date(input);
  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);
  if (absMinutes < 60) return diffMs >= 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`;
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return diffMs >= 0 ? `in ${absHours}h` : `${absHours}h ago`;
  const absDays = Math.round(absHours / 24);
  return diffMs >= 0 ? `in ${absDays}d` : `${absDays}d ago`;
}

function mapPlayerStatus(players: PlayerInfo[]): PlayerStatus[] {
  return players.map((player, index) => {
    const currentTrack = player.nowPlaying?.title || player.playlist?.[player.playlistIndex]?.title || "Idle";
    const duration = player.nowPlaying?.duration || player.playlist?.[player.playlistIndex]?.duration || 180;
    // Derive online/offline from lastSeen if available. Treat anything within
    // the last 2 minutes as online; otherwise offline. This prevents the UI
    // from showing random/hardcoded statuses.
    const lastSeen = player.lastSeen ? new Date(player.lastSeen).getTime() : 0;
    const isOnline = lastSeen && Date.now() - lastSeen <= 2 * 60 * 1000;
    return {
      name: player.roomName || player.playerName || `Player ${index + 1}`,
      player: player.playerName || player.roomName || player.id,
      status: isOnline ? "online" : "offline",
      current: currentTrack,
      progress: player.playingProgress || 0,
      duration,
    };
  });
}

function mapUpcomingBroadcasts(schedules: ScheduleEntry[], players: PlayerInfo[]): Broadcast[] {
  const playersById = new Map(players.map((player) => [player.id, player]));
  return [...schedules]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5)
    .map((schedule) => {
      const startsAt = new Date(schedule.startsAt);
      const location = playersById.get(schedule.playerId)?.roomName || schedule.playerName || "Unknown location";
      return {
        time: `${dayLabel.format(startsAt)} ${timeLabel.format(startsAt)}`,
        title: schedule.title,
        location,
        duration: `${Math.max(1, Math.round((new Date(schedule.endsAt).getTime() - startsAt.getTime()) / 60000))}m`,
        status: schedule.recurrence,
      };
    });
}

function mapRecentActivity(schedules: ScheduleEntry[], players: PlayerInfo[], activityLogs?: ActivityLogEntry[]): ActivityItem[] {
  // If we have activity logs from the API, use those first
  if (activityLogs && activityLogs.length > 0) {
    return activityLogs.slice(0, 5).map((log) => {
      const relTime = relativeTime(log.createdAt);
      let action = log.action;
      let type = "update";

      if (log.action.includes("created")) type = "start";
      else if (log.action.includes("started")) type = "connect";
      else if (log.action.includes("completed")) type = "complete";

      // Ensure detail is a string
      const detailsObj = log.details || {};
      const detailString = typeof detailsObj === 'string'
        ? detailsObj
        : (typeof detailsObj === 'object' && (detailsObj as any).description)
        ? (detailsObj as any).description
        : `${log.targetType || "Item"} activity`;

      return {
        time: relTime,
        action,
        detail: detailString,
        type,
      };
    });
  }

  // Fall back to schedules if no activity logs
  const playersById = new Map(players.map((player) => [player.id, player]));
  return [...schedules]
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, 5)
    .map((schedule) => {
      const location = playersById.get(schedule.playerId)?.roomName || schedule.playerName || "Unknown location";
      return {
        time: relativeTime(schedule.startsAt),
        action: "Broadcast scheduled",
        detail: `${schedule.title} — ${location}`,
        type: "update",
      };
    });
}

export default function DashboardClient() {
  const apiClient = getApiClient();
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
    queryFn: async () => {
      const res = await apiClient.listClients().catch(() => ({ ok: false, clients: [] }));
      return res.clients ?? [];
    },
    enabled: isSuperAdmin,
  });

  const healthQuery = useQuery({
    queryKey: queryKeys.systemHealth(),
    queryFn: () => fetchSystemHealth(),
  });

  const activityQuery = useQuery({
    queryKey: queryKeys.dashboardActivity(),
    queryFn: () => fetchDashboardActivity(),
  });

  const players = playersQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const systemHealth = healthQuery.data ?? null;
  const activityLogs = activityQuery.data ?? [];

  const isLoading =
    playersQuery.isPending ||
    mediaQuery.isPending ||
    schedulesQuery.isPending ||
    healthQuery.isPending ||
    activityQuery.isPending;

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

  const quickStats: QuickStat[] = useMemo(() => {
    const activePlayers = players.filter((player) => {
      if (!player.lastSeen) return false;
      const last = new Date(player.lastSeen).getTime();
      return Date.now() - last <= 2 * 60 * 1000; // active within last 2 minutes
    }).length;

    const healthRate = systemHealth?.heartbeatSuccessRate ?? 0;
    const healthValue = systemHealth ? Math.round(healthRate) : 0;
    const healthStatus = !systemHealth
      ? "Unavailable"
      : healthRate >= 80
        ? "Healthy"
        : healthRate >= 50
          ? "Degraded"
          : "Check status";

    const secondStat: QuickStat = isSuperAdmin
      ? {
          label: "Clients",
          value: String(clients.length),
          icon: "Building",
          trend: "✓ managed globally",
        }
      : {
          label: "Weekly Schedule",
          value: "Active",
          valueClassName: "text-green-600",
          icon: "Calendar",
          trend: "",
          subtext: "✓ Calendar is synced & published",
        };

    return [
      { label: "Listeners", value: String(activePlayers), icon: "Speaker", trend: "currently online" },
      secondStat,
      { label: "Players", value: String(players.length), icon: "Cast", trend: "registered" },
      { label: "System Health", value: String(healthValue) + "%", icon: "Activity", trend: healthStatus },
    ];
  }, [players, clients.length, isSuperAdmin, systemHealth]);

  const livePlayers = useMemo(() => mapPlayerStatus(players), [players]);
  const upcomingBroadcasts = useMemo(() => mapUpcomingBroadcasts(schedules, players), [schedules, players]);
  const recentActivity = useMemo(() => mapRecentActivity(schedules, players, activityLogs), [schedules, players, activityLogs]);

if (isLoading) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121214]">
      <div className="sticky top-0 z-10 bg-white dark:bg-[#121214]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-56 h-8 bg-gray-200 dark:bg-zinc-800 rounded-md" aria-hidden="true" />
              <div className="w-96 h-4 bg-gray-200 dark:bg-zinc-800 rounded-md mt-2" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:block">
                <div className="w-72 h-12 bg-gray-200 dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
              </div>
              <div className="w-36 h-12 bg-gray-200 dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white dark:bg-[#121214]">
        <div className="px-6 py-6">

          {/* Quick stats skeleton row */}
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
              <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
              <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
              <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
            </div>
          </div>

          {/* Skeleton / wireframe grid */}
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-[12px] border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
                <div className="h-60 bg-gray-200 dark:bg-zinc-800 rounded-[12px] border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
              </div>

              <div className="space-y-6">
                <div className="h-24 bg-gray-200 dark:bg-zinc-800 rounded-[12px] border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
                <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-[12px] border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
                <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-[12px] border border-gray-200 dark:border-zinc-700" aria-hidden="true" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-[#121214]">
      {error && (
        <div className="mx-8 mt-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

  <DashboardHeader stats={quickStats} showStats={true} />

      <div className="p-4 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LivePlayerStatus players={livePlayers} />
            <RecentActivityFeed activities={recentActivity} />
          </div>

          <div className="space-y-6">
            <SystemAlerts
              alerts={
                systemHealth && !systemHealth.ok
                  ? [
                      {
                        id: "health-1",
                        severity: "warning",
                        title: "System Health Degraded",
                        message: `${systemHealth.offlinePlayers || 0} players offline`,
                      },
                    ]
                  : []
              }
              isLoading={isLoading}
            />
            <UpcomingBroadcasts broadcasts={upcomingBroadcasts} />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}

