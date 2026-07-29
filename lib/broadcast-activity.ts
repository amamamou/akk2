import type {
  ActivityLogEntry,
  PlaybackLogEntry,
  PlayerInfo,
  ScheduleEntry,
} from "@/types/api";

export const BROADCAST_ACTIVITY_COLORS = [
  "#F4EDFF",
  "#E9DBFF",
  "#D9C0FF",
  "#C59DFF",
  "#A473FF",
  "#8B58FF",
] as const;

export const BROADCAST_ACTIVITY_WEEKS = 14;

export interface BroadcastActivityCell {
  date: Date;
  dateKey: string;
  dayOfWeek: number;
  weekIndex: number;
  level: number;
  total: number;
  broadcasts: number;
  schedules: number;
  playbacks: number;
  playerActivity: number;
  isFuture: boolean;
  isToday: boolean;
}

export interface BroadcastActivitySummary {
  cells: BroadcastActivityCell[];
  weekCount: number;
  totalBroadcasts: number;
  monthGrowthPercent: number;
  mostActiveVenue: string;
  mostActiveDay: string;
  playbackSuccessPercent: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function isBroadcastAction(action: string): boolean {
  const a = action.toLowerCase();
  return (
    a.includes("broadcast") ||
    a.includes("playback") ||
    a.includes("started") ||
    a.includes("completed") ||
    a.includes("played")
  );
}

function isSuccessfulPlayback(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s !== "FAILED" && s !== "ERROR" && s !== "LIGHT" && s !== "BOUNCE" && s !== "TOTAL";
}

function bumpDay(
  map: Map<string, { broadcasts: number; schedules: number; playbacks: number; playerActivity: number }>,
  date: Date | null,
  field: "broadcasts" | "schedules" | "playbacks" | "playerActivity"
) {
  if (!date) return;
  const key = toDateKey(date);
  const row = map.get(key) ?? { broadcasts: 0, schedules: 0, playbacks: 0, playerActivity: 0 };
  row[field] += 1;
  map.set(key, row);
}

function levelFromTotal(total: number, max: number): number {
  if (total <= 0 || max <= 0) return 0;
  const ratio = total / max;
  if (ratio <= 0.12) return 1;
  if (ratio <= 0.28) return 2;
  if (ratio <= 0.48) return 3;
  if (ratio <= 0.72) return 4;
  return 5;
}

export function buildBroadcastActivitySummary(
  activityLogs: ActivityLogEntry[],
  schedules: ScheduleEntry[],
  playbackLogs: PlaybackLogEntry[],
  players: PlayerInfo[],
  playbackSuccessRate?: number
): BroadcastActivitySummary {
  const today = startOfDay(new Date());
  const weekCount = BROADCAST_ACTIVITY_WEEKS;

  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - today.getDay());
  gridStart.setDate(gridStart.getDate() - (weekCount - 1) * 7);

  const dayMap = new Map<
    string,
    { broadcasts: number; schedules: number; playbacks: number; playerActivity: number }
  >();

  for (const log of activityLogs) {
    if (isBroadcastAction(log.action)) {
      bumpDay(dayMap, parseDate(log.createdAt), "broadcasts");
    }
  }

  for (const schedule of schedules) {
    bumpDay(dayMap, parseDate(schedule.startsAt), "schedules");
  }

  for (const log of playbackLogs) {
    bumpDay(dayMap, parseDate(log.startedAt ?? log.createdAt), "playbacks");
    if (isSuccessfulPlayback(log.status)) {
      bumpDay(dayMap, parseDate(log.startedAt ?? log.createdAt), "broadcasts");
    }
  }

  for (const player of players) {
    bumpDay(dayMap, parseDate(player.lastSeen), "playerActivity");
  }

  const venueCounts = new Map<string, number>();
  for (const log of playbackLogs) {
    const venue = log.playerName?.trim();
    if (!venue) continue;
    venueCounts.set(venue, (venueCounts.get(venue) ?? 0) + 1);
  }
  for (const player of players) {
    const venue = player.roomName?.trim() || player.playerName?.trim();
    if (!venue) continue;
    venueCounts.set(venue, (venueCounts.get(venue) ?? 0) + 1);
  }

  let mostActiveVenue = "—";
  let maxVenue = 0;
  for (const [name, count] of venueCounts) {
    if (count > maxVenue) {
      maxVenue = count;
      mostActiveVenue = name;
    }
  }

  const dayOfWeekTotals = Array.from({ length: 7 }, () => 0);
  const cells: BroadcastActivityCell[] = [];

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + weekIndex * 7 + dayOfWeek);
      const dateKey = toDateKey(date);
      const counts = dayMap.get(dateKey) ?? {
        broadcasts: 0,
        schedules: 0,
        playbacks: 0,
        playerActivity: 0,
      };
      const total =
        counts.broadcasts + counts.schedules + counts.playbacks + counts.playerActivity;
      const isFuture = date > today;
      if (!isFuture) dayOfWeekTotals[dayOfWeek] += total;

      cells.push({
        date,
        dateKey,
        dayOfWeek,
        weekIndex,
        level: 0,
        total,
        broadcasts: counts.broadcasts,
        schedules: counts.schedules,
        playbacks: counts.playbacks,
        playerActivity: counts.playerActivity,
        isFuture,
        isToday: dateKey === toDateKey(today),
      });
    }
  }

  const pastCells = cells.filter((c) => !c.isFuture);
  const maxTotal = pastCells.reduce((m, c) => Math.max(m, c.total), 0);

  for (const cell of cells) {
    cell.level = cell.isFuture ? 0 : levelFromTotal(cell.total, maxTotal);
  }

  let peakDayIndex = 0;
  const hasDayActivity = dayOfWeekTotals.some((n) => n > 0);
  if (hasDayActivity) {
    for (let d = 0; d < 7; d++) {
      if (dayOfWeekTotals[d] > dayOfWeekTotals[peakDayIndex]) peakDayIndex = d;
    }
  }

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  for (const cell of pastCells) {
    if (cell.date >= thisMonthStart) thisMonthTotal += cell.broadcasts + cell.schedules;
    if (cell.date >= lastMonthStart && cell.date <= lastMonthEnd) {
      lastMonthTotal += cell.broadcasts + cell.schedules;
    }
  }

  const monthGrowthPercent =
    lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : thisMonthTotal > 0
        ? 100
        : 0;

  const totalBroadcasts = pastCells.reduce((sum, c) => sum + c.broadcasts + c.schedules, 0);

  let playbackSuccessPercent = playbackSuccessRate ?? 0;
  if (playbackLogs.length > 0) {
    const ok = playbackLogs.filter((l) => isSuccessfulPlayback(l.status)).length;
    playbackSuccessPercent = (ok / playbackLogs.length) * 100;
  }

  return {
    cells,
    weekCount,
    totalBroadcasts,
    monthGrowthPercent,
    mostActiveVenue,
    mostActiveDay: hasDayActivity ? DAY_NAMES[peakDayIndex] : "—",
    playbackSuccessPercent,
  };
}

export function formatActivityDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
