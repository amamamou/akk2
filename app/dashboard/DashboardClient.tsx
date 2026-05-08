"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import LivePlayerStatus, { type PlayerStatus } from "./components/LivePlayerStatus";
import RecentActivityFeed, { type ActivityItem } from "./components/RecentActivityFeed";
import UpcomingBroadcasts, { type Broadcast } from "./components/UpcomingBroadcasts";
import QuickActions from "./components/QuickActions";
import { getApiClient } from "@/lib/api-client";
import type { MediaInfo, PlayerInfo, ScheduleEntry } from "@/types/api";
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

function mapRecentActivity(schedules: ScheduleEntry[], players: PlayerInfo[]): ActivityItem[] {
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
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [media, setMedia] = useState<MediaInfo[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [playersRes, mediaRes, schedulesRes] = await Promise.all([
          apiClient.listPlayers(),
          apiClient.listMedia(),
          apiClient.listSchedules(),
        ]);
        if (cancelled) return;
        setPlayers(playersRes.players);
        setMedia(mediaRes.media);
        setSchedules(schedulesRes.schedules);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.error || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    // Re-fetch players every 30 seconds so the live status updates without a
    // full page refresh. We only refresh the players list on interval to
    // avoid reloading media/schedules unnecessarily.
    const intervalId = typeof window !== "undefined" ? window.setInterval(async () => {
      try {
        const playersRes = await apiClient.listPlayers();
        if (!cancelled) setPlayers(playersRes.players);
      } catch {
        // ignore transient errors on polling
      }
    }, 30_000) : undefined;

    const onPlayersUpdated = () => {
      void load();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("akou:players-updated", onPlayersUpdated);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("akou:players-updated", onPlayersUpdated);
      }
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [apiClient]);

  const quickStats: QuickStat[] = useMemo(() => {
    const activePlayers = players.filter((player) => {
      if (!player.lastSeen) return false;
      const last = new Date(player.lastSeen).getTime();
      return Date.now() - last <= 2 * 60 * 1000; // active within last 2 minutes
    }).length;
    return [
      { label: "Total Players", value: String(players.length), icon: "Cast", trend: `${activePlayers} online` },
      { label: "Total Media", value: String(media.length), icon: "Music2", trend: `${schedules.length} scheduled` },
      { label: "Active Players", value: String(activePlayers), icon: "Speaker", trend: "Live now" },
      { label: "Upcoming", value: String(Math.min(5, schedules.length)), icon: "Calendar", trend: "Next 5 events" },
    ];
  }, [media.length, players, schedules.length]);

  const livePlayers = useMemo(() => mapPlayerStatus(players), [players]);
  const upcomingBroadcasts = useMemo(() => mapUpcomingBroadcasts(schedules, players), [schedules, players]);
  const recentActivity = useMemo(() => mapRecentActivity(schedules, players), [schedules, players]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-sm text-gray-600">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50/30">
      {error && (
        <div className="mx-8 mt-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      <DashboardHeader stats={quickStats} />

      <div className="p-8 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LivePlayerStatus players={livePlayers} />
            <RecentActivityFeed activities={recentActivity} />
          </div>

          <div className="space-y-6">
            <UpcomingBroadcasts broadcasts={upcomingBroadcasts} />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}

