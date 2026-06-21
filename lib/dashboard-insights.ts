import type {
  ActivityLogEntry,
  MediaInfo,
  PlaybackLogEntry,
  PlayerInfo,
  ScheduleEntry,
  SystemHealthMetrics,
} from "@/types/api";
import { countTodayBroadcasts, buildScheduleSnapshot as buildSnapshot } from "@/lib/schedule-snapshot";
import type { ScheduleSnapshotItem } from "@/lib/schedule-snapshot";
export type { ScheduleSnapshotItem } from "@/lib/schedule-snapshot";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
const HEALTHY_HEARTBEAT_MS = 60 * 1000;

function heartbeatAgeMs(player: PlayerInfo): number | null {
  if (!player.lastSeen) return null;
  const ts = new Date(player.lastSeen).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Date.now() - ts);
}

/** Online = recent heartbeat when available; never trust stale API status over lastSeen. */
export function isPlayerOnline(player: PlayerInfo): boolean {
  const age = heartbeatAgeMs(player);
  if (age !== null) return age <= ONLINE_THRESHOLD_MS;

  const status = String(player.status || "").toLowerCase();
  return status === "online" || status === "idle";
}

export function resolvePlayerHealth(
  player: PlayerInfo,
  online: boolean
): LivePlayerRow["health"] {
  if (!online) return "offline";

  const age = heartbeatAgeMs(player);
  if (age === null) return "healthy";
  if (age <= HEALTHY_HEARTBEAT_MS) return "healthy";
  return "degraded";
}

export interface OperationalOverview {
  broadcasts: number;
  activePlayers: number;
  /** Super-admin portfolio size; null for workspace managers. */
  clients: number | null;
  /** Distinct venue / room names in the manager workspace. */
  locations: number;
  successRate: number;
  offlineCount: number;
}

function countUniqueLocations(players: PlayerInfo[]): number {
  const names = new Set<string>();
  for (const player of players) {
    const name = player.roomName?.trim() || player.playerName?.trim();
    if (name) names.add(name);
  }
  return names.size;
}

export interface LivePlayerRow {
  id: string;
  location: string;
  playerName: string;
  currentTrack: string;
  progress: number;
  duration: number;
  status: "online" | "offline";
  health: "healthy" | "degraded" | "offline";
  lastHeartbeat: string | null;
  isPlaying: boolean;
}

export interface LiveSummary {
  online: number;
  offline: number;
  playing: number;
  healthRate: number;
}

export interface VenueInsight {
  name: string;
  playerCount: number;
  onlineCount: number;
  playbackCount: number;
  successRate: number | null;
}

export interface PlayerInsightData {
  onlineCount: number;
  offlineCount: number;
  mostActivePlayer: string;
  highestUsageRoom: string;
  totalPlayers: number;
}

export interface AudioInsightData {
  mostPlayed: { title: string; count: number } | null;
  mostScheduled: { title: string; count: number } | null;
  recentlyUploaded: { title: string } | null;
  librarySize: number;
  playbackCount: number;
}

export interface TimelineActivity {
  id: string;
  time: string;
  action: string;
  detail: string;
  type: "start" | "connect" | "complete" | "update" | "alert";
  timestamp: Date;
}

export interface SystemAlertItem {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

function relativeTime(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);
  if (absMinutes < 60) return diffMs >= 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`;
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return diffMs >= 0 ? `in ${absHours}h` : `${absHours}h ago`;
  const absDays = Math.round(absHours / 24);
  return diffMs >= 0 ? `in ${absDays}d` : `${absDays}d ago`;
}

function isSuccessfulPlayback(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s !== "FAILED" && s !== "ERROR";
}

export function resolveHealthRate(
  systemHealth: SystemHealthMetrics | null,
  players: PlayerInfo[],
  playbackLogs: PlaybackLogEntry[]
): number {
  if (systemHealth) {
    if (systemHealth.heartbeatSuccessRate > 0) {
      return systemHealth.heartbeatSuccessRate;
    }
    if (systemHealth.totalPlayers > 0) {
      return (systemHealth.onlinePlayers / systemHealth.totalPlayers) * 100;
    }
    if (systemHealth.totalPlaybackLogs > 0) {
      return (systemHealth.successfulPlaybacks / systemHealth.totalPlaybackLogs) * 100;
    }
  }

  if (players.length > 0) {
    const online = players.filter(isPlayerOnline).length;
    return (online / players.length) * 100;
  }

  if (playbackLogs.length > 0) {
    const ok = playbackLogs.filter((l) => isSuccessfulPlayback(l.status)).length;
    return (ok / playbackLogs.length) * 100;
  }

  return 0;
}

export function buildLiveSummary(
  players: PlayerInfo[],
  systemHealth: SystemHealthMetrics | null,
  playbackLogs: PlaybackLogEntry[]
): LiveSummary {
  const online = players.filter(isPlayerOnline).length;
  const offline = players.length - online;
  const playing = players.filter((p) => p.isPlaying && isPlayerOnline(p)).length;

  return {
    online,
    offline,
    playing,
    healthRate: resolveHealthRate(systemHealth, players, playbackLogs),
  };
}

export function buildOperationalOverview(
  schedules: ScheduleEntry[],
  players: PlayerInfo[],
  clientsCount: number | null,
  systemHealth: SystemHealthMetrics | null,
  playbackLogs: PlaybackLogEntry[]
): OperationalOverview {
  const todayBroadcasts = countTodayBroadcasts(schedules);

  const live = buildLiveSummary(players, systemHealth, playbackLogs);

  return {
    broadcasts: todayBroadcasts,
    activePlayers: live.online,
    clients: clientsCount,
    locations: countUniqueLocations(players),
    successRate: live.healthRate,
    offlineCount: live.offline,
  };
}

export function buildLivePlayerRows(players: PlayerInfo[]): LivePlayerRow[] {
  return players.map((player) => {
    const online = isPlayerOnline(player);
    const health = resolvePlayerHealth(player, online);
    const currentTrack =
      player.nowPlaying?.title ||
      player.playlist?.[player.playlistIndex]?.title ||
      "Idle";
    const duration =
      player.nowPlaying?.duration ||
      player.playlist?.[player.playlistIndex]?.duration ||
      180;

    return {
      id: player.id,
      location: player.roomName?.trim() || player.playerName?.trim() || player.id,
      playerName: player.playerName?.trim() || player.id,
      currentTrack,
      progress: player.playingProgress || 0,
      duration,
      status: online ? "online" : "offline",
      health,
      lastHeartbeat: player.lastSeen ?? null,
      isPlaying: Boolean(player.isPlaying) && online,
    };
  });
}

export function buildScheduleSnapshot(
  schedules: ScheduleEntry[],
  players: PlayerInfo[],
  limit = 6
): ScheduleSnapshotItem[] {
  return buildSnapshot(schedules, players, limit);
}

export function buildVenueInsights(
  players: PlayerInfo[],
  playbackLogs: PlaybackLogEntry[]
): VenueInsight[] {
  const venueMap = new Map<
    string,
    { playerIds: Set<string>; playbacks: number; successes: number }
  >();

  for (const player of players) {
    const name = player.roomName?.trim() || player.playerName?.trim();
    if (!name) continue;
    const entry = venueMap.get(name) ?? {
      playerIds: new Set<string>(),
      playbacks: 0,
      successes: 0,
    };
    entry.playerIds.add(player.id);
    venueMap.set(name, entry);
  }

  for (const log of playbackLogs) {
    const name = log.playerName?.trim();
    if (!name) continue;
    const entry = venueMap.get(name) ?? {
      playerIds: new Set<string>(),
      playbacks: 0,
      successes: 0,
    };
    entry.playbacks += 1;
    if (isSuccessfulPlayback(log.status)) entry.successes += 1;
    venueMap.set(name, entry);
  }

  if (venueMap.size === 0) return [];

  return Array.from(venueMap.entries())
    .map(([name, data]) => {
      const venuePlayers = players.filter(
        (p) => (p.roomName?.trim() || p.playerName?.trim()) === name
      );
      const onlineCount = venuePlayers.filter(isPlayerOnline).length;

      return {
        name,
        playerCount: data.playerIds.size,
        onlineCount,
        playbackCount: data.playbacks,
        successRate:
          data.playbacks > 0
            ? Math.round((data.successes / data.playbacks) * 100)
            : null,
      };
    })
    .sort(
      (a, b) =>
        b.playbackCount - a.playbackCount ||
        b.onlineCount - a.onlineCount ||
        b.playerCount - a.playerCount
    )
    .slice(0, 5);
}

export function buildPlayerInsights(
  players: PlayerInfo[],
  playbackLogs: PlaybackLogEntry[]
): PlayerInsightData {
  const onlineCount = players.filter(isPlayerOnline).length;
  const offlineCount = players.length - onlineCount;

  const playerPlaybackCounts = new Map<string, number>();
  const roomPlaybackCounts = new Map<string, number>();

  for (const log of playbackLogs) {
    const pid = log.playerId?.trim();
    const room = log.playerName?.trim();
    if (pid) playerPlaybackCounts.set(pid, (playerPlaybackCounts.get(pid) ?? 0) + 1);
    if (room) roomPlaybackCounts.set(room, (roomPlaybackCounts.get(room) ?? 0) + 1);
  }

  let mostActivePlayer = "—";
  let maxPlayer = 0;
  for (const player of players) {
    const count = playerPlaybackCounts.get(player.id) ?? 0;
    if (count > maxPlayer) {
      maxPlayer = count;
      mostActivePlayer = player.playerName || player.roomName || player.id;
    }
  }
  if (maxPlayer === 0) mostActivePlayer = "—";

  let highestUsageRoom = "—";
  let maxRoom = 0;
  for (const [room, count] of roomPlaybackCounts) {
    if (count > maxRoom) {
      maxRoom = count;
      highestUsageRoom = room;
    }
  }
  if (maxRoom === 0) highestUsageRoom = "—";

  return {
    onlineCount,
    offlineCount,
    mostActivePlayer,
    highestUsageRoom,
    totalPlayers: players.length,
  };
}

export function buildAudioInsights(
  media: MediaInfo[],
  schedules: ScheduleEntry[],
  playbackLogs: PlaybackLogEntry[]
): AudioInsightData {
  const mediaPlayCounts = new Map<string, number>();
  const scheduleCounts = new Map<string, number>();

  for (const log of playbackLogs) {
    const title = log.mediaTitle?.trim();
    if (title) mediaPlayCounts.set(title, (mediaPlayCounts.get(title) ?? 0) + 1);
  }

  for (const schedule of schedules) {
    if (schedule.title) {
      scheduleCounts.set(schedule.title, (scheduleCounts.get(schedule.title) ?? 0) + 1);
    }
  }

  let mostPlayed: AudioInsightData["mostPlayed"] = null;
  for (const [title, count] of mediaPlayCounts) {
    if (!mostPlayed || count > mostPlayed.count) mostPlayed = { title, count };
  }

  let mostScheduled: AudioInsightData["mostScheduled"] = null;
  for (const [title, count] of scheduleCounts) {
    if (!mostScheduled || count > mostScheduled.count) mostScheduled = { title, count };
  }

  const recentlyUploaded = null;

  return {
    mostPlayed,
    mostScheduled,
    recentlyUploaded,
    librarySize: media.length,
    playbackCount: playbackLogs.length,
  };
}

function humanizeAction(action: string): string {
  const normalized = action.trim().replace(/_/g, " ").toLowerCase();
  if (normalized.includes("player") && normalized.includes("creat")) return "Player added";
  if (normalized.includes("player") && normalized.includes("updat")) return "Player updated";
  if (normalized.includes("player") && normalized.includes("delet")) return "Player removed";
  if (normalized.includes("schedule") && normalized.includes("creat")) return "Schedule created";
  if (normalized.includes("schedule") && normalized.includes("updat")) return "Schedule updated";
  if (normalized.includes("schedule") && normalized.includes("delet")) return "Schedule removed";
  if (normalized.includes("media") && normalized.includes("creat")) return "Media uploaded";
  if (normalized.includes("media") && normalized.includes("updat")) return "Media updated";
  if (normalized.includes("playback") && normalized.includes("complet")) return "Playback completed";
  if (normalized.includes("playback") && normalized.includes("start")) return "Playback started";
  if (normalized.includes("playback") && normalized.includes("fail")) return "Playback failed";
  if (normalized.includes("connect")) return "Player connected";
  if (normalized.includes("disconnect")) return "Player disconnected";

  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function resolveActivityEntity(
  log: ActivityLogEntry,
  players: PlayerInfo[],
  media: MediaInfo[],
  schedules: ScheduleEntry[]
): string {
  const detailsRaw = log.details as unknown;
  if (detailsRaw && typeof detailsRaw === "object") {
    const record = detailsRaw as Record<string, unknown>;
    for (const key of ["title", "name", "playerName", "roomName", "mediaTitle", "label"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  const targetId = log.targetId?.trim();
  const targetType = String(log.targetType || "").toLowerCase();

  if (targetId) {
    if (targetType.includes("player")) {
      const player = players.find((p) => p.id === targetId);
      return player?.roomName?.trim() || player?.playerName?.trim() || targetId;
    }
    if (targetType.includes("schedule")) {
      const schedule = schedules.find((s) => s.id === targetId);
      return schedule?.title?.trim() || targetId;
    }
    if (targetType.includes("media")) {
      const item = media.find((m) => m.id === targetId);
      return item?.title?.trim() || targetId;
    }
  }

  if (typeof detailsRaw === "string" && detailsRaw.trim()) return detailsRaw.trim();

  return "";
}

export function buildActivityTimeline(
  activityLogs: ActivityLogEntry[],
  players: PlayerInfo[],
  media: MediaInfo[],
  schedules: ScheduleEntry[],
  limit = 8
): TimelineActivity[] {
  return activityLogs.slice(0, limit).map((log) => {
    const actionLower = log.action.toLowerCase();
    let type: TimelineActivity["type"] = "update";
    if (actionLower.includes("created")) type = "start";
    else if (actionLower.includes("started") || actionLower.includes("connect")) type = "connect";
    else if (actionLower.includes("completed")) type = "complete";
    else if (actionLower.includes("fail") || actionLower.includes("alert")) type = "alert";

    const headline = humanizeAction(log.action);
    const entity = resolveActivityEntity(log, players, media, schedules);

    return {
      id: log.id,
      time: relativeTime(log.createdAt),
      action: headline,
      detail: entity || "—",
      type,
      timestamp: new Date(log.createdAt),
    };
  });
}

export function buildSystemAlerts(
  systemHealth: SystemHealthMetrics | null,
  players: PlayerInfo[],
  playbackLogs: PlaybackLogEntry[]
): SystemAlertItem[] {
  const alerts: SystemAlertItem[] = [];
  const live = buildLiveSummary(players, systemHealth, playbackLogs);

  if (systemHealth?.failedPlaybacks && systemHealth.failedPlaybacks > 0) {
    alerts.push({
      id: "playback-failures",
      severity: "warning",
      title: "Playback failures detected",
      message: `${systemHealth.failedPlaybacks} failed playback${systemHealth.failedPlaybacks > 1 ? "s" : ""} recorded`,
    });
  }

  if (systemHealth?.failedSchedules && systemHealth.failedSchedules > 0) {
    alerts.push({
      id: "schedule-failures",
      severity: "warning",
      title: "Schedule execution failures",
      message: `${systemHealth.failedSchedules} schedule${systemHealth.failedSchedules > 1 ? "s" : ""} failed`,
    });
  }

  const failedLogs = playbackLogs.filter((l) => !isSuccessfulPlayback(l.status)).length;
  if (failedLogs > 0 && !alerts.some((a) => a.id === "playback-failures")) {
    alerts.push({
      id: "playback-log-failures",
      severity: "warning",
      title: "Failed playback logs",
      message: `${failedLogs} unsuccessful playback entries in recent logs`,
    });
  }

  if (players.length > 0) {
    if (live.online === 0) {
      alerts.push({
        id: "all-offline",
        severity: "critical",
        title: "All players offline",
        message: `${players.length} registered player${players.length > 1 ? "s" : ""}, none connected`,
      });
    } else if (live.offline > 0) {
      alerts.push({
        id: "partial-offline",
        severity: "warning",
        title: "Players offline",
        message: `${live.offline} of ${players.length} players not connected`,
      });
    }
  }

  if (systemHealth && !systemHealth.ok && live.online > 0 && alerts.length === 0) {
    alerts.push({
      id: "health-degraded",
      severity: "warning",
      title: "System health check flagged issues",
      message: "Review player connectivity and schedule execution",
    });
  }

  return alerts;
}
