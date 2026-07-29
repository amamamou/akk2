import type { PlaybackLogEntry } from "@/types/api";

/**
 * Playback engagement tiers — duration-based (production contract).
 *
 * Bounce   < 3s
 * Started  3s ≤ duration < 10s
 * Light    10s ≤ duration < 20s
 * Moderate 20s ≤ duration ≤ 30s
 * Deep     > 30s
 *
 * Status codes: BOUNCE | STARTED | LIGHT | MODERATE | DEEP
 * Legacy ENGAGED → Started; legacy TOTAL → Bounce.
 */
export const ENGAGEMENT_TIERS = [
  "BOUNCE",
  "STARTED",
  "LIGHT",
  "MODERATE",
  "DEEP",
] as const;

export type EngagementTier = (typeof ENGAGEMENT_TIERS)[number];

export const ENGAGEMENT_TIER_META: Record<
  EngagementTier,
  { label: string; description: string }
> = {
  BOUNCE: { label: "Bounce", description: "< 3s" },
  STARTED: { label: "Started", description: "3–10s" },
  LIGHT: { label: "Light", description: "10–20s" },
  MODERATE: { label: "Moderate", description: "20–30s" },
  DEEP: { label: "Deep", description: "> 30s" },
};

const STATUS_ALIASES: Record<string, EngagementTier> = {
  ENGAGED: "STARTED",
  TOTAL: "BOUNCE",
};

export interface ListenerSegmentation {
  /** Sum of all five engagement tiers (true Total). */
  totalSessions: number;
  /** Distinct players in the filtered log set (operational context). */
  uniquePlayers: number;
  bounceListeners: number;
  startedListeners: number;
  lightListeners: number;
  moderateListeners: number;
  deepListeners: number;
  engagementTrend: string;
  retentionRate: string;
}

export interface EngagementSlice {
  id: string;
  segment: string;
  tier: EngagementTier;
  count: number;
  description: string;
}

export interface HourlyTrafficRow {
  hour: string;
  bounce: number;
  started: number;
  light: number;
  moderate: number;
  deep: number;
}

function normalizeStatus(status: string): string {
  return String(status || "").trim().toUpperCase();
}

export function engagementTierFromDuration(durationSeconds: number): EngagementTier {
  const seconds = Number.isFinite(durationSeconds) ? Math.max(0, Math.floor(durationSeconds)) : 0;
  if (seconds < 3) return "BOUNCE";
  if (seconds < 10) return "STARTED";
  if (seconds < 20) return "LIGHT";
  if (seconds <= 30) return "MODERATE";
  return "DEEP";
}

/** Resolve tier from duration (preferred) or legacy status. */
export function resolveEngagementTier(
  durationSeconds: number | null | undefined,
  status: string
): EngagementTier | null {
  const raw = normalizeStatus(status);
  if (raw === "FAILED" || raw === "ERROR") return null;

  if (durationSeconds != null && Number.isFinite(durationSeconds) && durationSeconds >= 0) {
    return engagementTierFromDuration(durationSeconds);
  }

  const mapped = STATUS_ALIASES[raw] ?? raw;
  if ((ENGAGEMENT_TIERS as readonly string[]).includes(mapped)) {
    // Lifecycle STARTED with no duration is incomplete — not a tier.
    if (mapped === "STARTED" && raw === "STARTED") return null;
    return mapped as EngagementTier;
  }
  return null;
}

export function filterEngagementTierLogs(logs: PlaybackLogEntry[]): PlaybackLogEntry[] {
  return logs.filter((log) => resolveEngagementTier(log.durationSeconds, log.status) != null);
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
  const mapped = STATUS_ALIASES[normalizeStatus(status)] ?? normalizeStatus(status);
  return (ENGAGEMENT_TIERS as readonly string[]).includes(mapped);
}

export function tierDisplayLabel(status: string): string {
  const tier =
    resolveEngagementTier(null, status) ??
    (STATUS_ALIASES[normalizeStatus(status)] as EngagementTier | undefined);
  if (tier) return ENGAGEMENT_TIER_META[tier].label;
  return status;
}

export function tierDescription(status: string): string {
  const tier =
    resolveEngagementTier(null, status) ??
    (STATUS_ALIASES[normalizeStatus(status)] as EngagementTier | undefined);
  if (tier) return ENGAGEMENT_TIER_META[tier].description;
  return "";
}

/** KPI tiers: count sessions by duration-derived engagement bucket. */
export function buildListenerSegmentationFromLogs(
  logs: PlaybackLogEntry[],
  heartbeatSuccessRate: number
): ListenerSegmentation {
  const distinctPlayers = new Set(
    logs.map((l) => l.playerId).filter((id) => Boolean(id && String(id).trim()))
  );

  let bounceListeners = 0;
  let startedListeners = 0;
  let lightListeners = 0;
  let moderateListeners = 0;
  let deepListeners = 0;

  for (const log of logs) {
    const tier = resolveEngagementTier(log.durationSeconds, log.status);
    if (tier === "BOUNCE") bounceListeners += 1;
    else if (tier === "STARTED") startedListeners += 1;
    else if (tier === "LIGHT") lightListeners += 1;
    else if (tier === "MODERATE") moderateListeners += 1;
    else if (tier === "DEEP") deepListeners += 1;
  }

  const totalSessions =
    bounceListeners + startedListeners + lightListeners + moderateListeners + deepListeners;
  const retained = startedListeners + lightListeners + moderateListeners + deepListeners;
  const retentionRate =
    totalSessions > 0 ? `${((retained / totalSessions) * 100).toFixed(1)}%` : "0%";

  return {
    totalSessions,
    uniquePlayers: distinctPlayers.size,
    bounceListeners,
    startedListeners,
    lightListeners,
    moderateListeners,
    deepListeners,
    engagementTrend: `${heartbeatSuccessRate.toFixed(1)}%`,
    retentionRate,
  };
}

export function buildEngagementData(seg: ListenerSegmentation): EngagementSlice[] {
  return (
    [
      {
        id: "e1",
        tier: "BOUNCE" as const,
        segment: ENGAGEMENT_TIER_META.BOUNCE.label,
        description: ENGAGEMENT_TIER_META.BOUNCE.description,
        count: seg.bounceListeners,
      },
      {
        id: "e2",
        tier: "STARTED" as const,
        segment: ENGAGEMENT_TIER_META.STARTED.label,
        description: ENGAGEMENT_TIER_META.STARTED.description,
        count: seg.startedListeners,
      },
      {
        id: "e3",
        tier: "LIGHT" as const,
        segment: ENGAGEMENT_TIER_META.LIGHT.label,
        description: ENGAGEMENT_TIER_META.LIGHT.description,
        count: seg.lightListeners,
      },
      {
        id: "e4",
        tier: "MODERATE" as const,
        segment: ENGAGEMENT_TIER_META.MODERATE.label,
        description: ENGAGEMENT_TIER_META.MODERATE.description,
        count: seg.moderateListeners,
      },
      {
        id: "e5",
        tier: "DEEP" as const,
        segment: ENGAGEMENT_TIER_META.DEEP.label,
        description: ENGAGEMENT_TIER_META.DEEP.description,
        count: seg.deepListeners,
      },
    ] as EngagementSlice[]
  ).filter((e) => e.count > 0);
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
    buckets.set(hour, {
      hour,
      bounce: 0,
      started: 0,
      light: 0,
      moderate: 0,
      deep: 0,
    });
  }

  for (const log of logs) {
    const hour = logHourKey(log);
    if (!hour || !buckets.has(hour)) continue;
    const row = buckets.get(hour)!;
    const tier = resolveEngagementTier(log.durationSeconds, log.status);
    if (tier === "BOUNCE") row.bounce += 1;
    else if (tier === "STARTED") row.started += 1;
    else if (tier === "LIGHT") row.light += 1;
    else if (tier === "MODERATE") row.moderate += 1;
    else if (tier === "DEEP") row.deep += 1;
  }

  return Array.from(buckets.values()).filter(
    (row) => row.bounce + row.started + row.light + row.moderate + row.deep > 0
  );
}

/** Heartbeat success: share of tier sessions that are not Bounce. */
export function heartbeatRateFromLogs(logs: PlaybackLogEntry[]): number {
  const tierLogs = logs.filter(
    (l) => resolveEngagementTier(l.durationSeconds, l.status) != null
  );
  if (tierLogs.length === 0) return 0;
  const ok = tierLogs.filter((l) => {
    const tier = resolveEngagementTier(l.durationSeconds, l.status);
    return tier != null && tier !== "BOUNCE";
  }).length;
  return (ok / tierLogs.length) * 100;
}
