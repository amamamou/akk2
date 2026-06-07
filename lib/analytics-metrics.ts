import type { PlaybackLogEntry } from "@/types/api";

export const ENGAGEMENT_TIERS = ["LIGHT", "ENGAGED", "MODERATE", "DEEP"] as const;
export type EngagementTier = (typeof ENGAGEMENT_TIERS)[number];

export interface ListenerSegmentation {
  totalListeners: number;
  engagedListeners: number;
  lightListeners: number;
  moderateListeners: number;
  deepListeners: number;
  engagementTrend: string;
  retentionRate: string;
}

export interface EngagementSlice {
  id: string;
  segment: string;
  count: number;
}

export interface HourlyTrafficRow {
  hour: string;
  engaged: number;
  deep: number;
  moderate: number;
  light: number;
}

function normalizeStatus(status: string): string {
  return String(status || "").trim().toUpperCase();
}

/** Logs whose status is exactly LIGHT | ENGAGED | MODERATE | DEEP (seed PlaybackLog values). */
export function filterEngagementTierLogs(logs: PlaybackLogEntry[]): PlaybackLogEntry[] {
  return logs.filter((log) => isEngagementTier(log.status));
}

export function normalizePlayerId(playerId: string | null | undefined): string {
  return String(playerId ?? "").trim().toLowerCase();
}

export function filterLogsByPlayerId(
  logs: PlaybackLogEntry[],
  selectedPlayerId: string
): PlaybackLogEntry[] {
  if (selectedPlayerId === "all") return [...logs];
  const target = normalizePlayerId(selectedPlayerId);
  return logs.filter((log) => normalizePlayerId(log.playerId) === target);
}

export function isEngagementTier(status: string): status is EngagementTier {
  return ENGAGEMENT_TIERS.includes(normalizeStatus(status) as EngagementTier);
}

export function tierDisplayLabel(status: string): string {
  const s = normalizeStatus(status);
  if (s === "LIGHT") return "Light";
  if (s === "ENGAGED") return "Engaged";
  if (s === "MODERATE") return "Moderate";
  if (s === "DEEP") return "Deep";
  return status;
}

/** KPI tiers: count rows whose status is exactly LIGHT | ENGAGED | MODERATE | DEEP. */
export function buildListenerSegmentationFromLogs(
  logs: PlaybackLogEntry[],
  heartbeatSuccessRate: number
): ListenerSegmentation {
  const distinctPlayers = new Set(
    logs.map((l) => l.playerId).filter((id) => Boolean(id && String(id).trim()))
  );
  const totalListeners = distinctPlayers.size;

  let deepListeners = 0;
  let engagedListeners = 0;
  let lightListeners = 0;
  let moderateListeners = 0;

  for (const log of logs) {
    const status = normalizeStatus(log.status);
    if (status === "DEEP") deepListeners += 1;
    else if (status === "ENGAGED") engagedListeners += 1;
    else if (status === "LIGHT") lightListeners += 1;
    else if (status === "MODERATE") moderateListeners += 1;
  }

  const tierSessions = lightListeners + engagedListeners + moderateListeners + deepListeners;
  const retained = engagedListeners + moderateListeners + deepListeners;
  const retentionRate =
    tierSessions > 0 ? `${((retained / tierSessions) * 100).toFixed(1)}%` : "0%";

  return {
    totalListeners,
    engagedListeners,
    lightListeners,
    moderateListeners,
    deepListeners,
    engagementTrend: `${heartbeatSuccessRate.toFixed(1)}%`,
    retentionRate,
  };
}

export function buildEngagementData(seg: ListenerSegmentation): EngagementSlice[] {
  return [
    { id: "e1", segment: "Deep", count: seg.deepListeners },
    { id: "e2", segment: "Moderate", count: seg.moderateListeners },
    { id: "e3", segment: "Light", count: seg.lightListeners },
    { id: "e4", segment: "Engaged", count: seg.engagedListeners },
  ].filter((e) => e.count > 0);
}

function logHourKey(log: PlaybackLogEntry): string | null {
  const raw = log.startedAt || log.createdAt;
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  } catch {
    return null;
  }
}

/** Hourly stacked bars from the same filtered PlaybackLog stream (tier status only). */
export function buildHourlyTrafficFromLogs(logs: PlaybackLogEntry[]): HourlyTrafficRow[] {
  const buckets = new Map<string, HourlyTrafficRow>();

  for (const hour of Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`)) {
    buckets.set(hour, { hour, engaged: 0, deep: 0, moderate: 0, light: 0 });
  }

  for (const log of logs) {
    const hour = logHourKey(log);
    if (!hour || !buckets.has(hour)) continue;
    const row = buckets.get(hour)!;
    const status = normalizeStatus(log.status);
    if (status === "ENGAGED") row.engaged += 1;
    else if (status === "DEEP") row.deep += 1;
    else if (status === "MODERATE") row.moderate += 1;
    else if (status === "LIGHT") row.light += 1;
  }

  return Array.from(buckets.values()).filter(
    (row) => row.engaged + row.deep + row.moderate + row.light > 0
  );
}

/** Heartbeat success: share of tier sessions that are not LIGHT. */
export function heartbeatRateFromLogs(logs: PlaybackLogEntry[]): number {
  const tierLogs = logs.filter((l) => isEngagementTier(l.status));
  if (tierLogs.length === 0) return 0;
  const ok = tierLogs.filter((l) => normalizeStatus(l.status) !== "LIGHT").length;
  return (ok / tierLogs.length) * 100;
}