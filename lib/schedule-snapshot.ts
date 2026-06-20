import type { PlayerInfo, ScheduleEntry } from "@/types/api";
import { buildWeekDays, formatLocalIsoDate } from "@/lib/schedule-calendar";
import { scheduleEntryToEventCard } from "@/lib/schedule-all-clients";

export interface ScheduleSnapshotItem {
  id: string;
  title: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  recurrence: string;
  phase: "active" | "upcoming";
  roomId: string;
  timeLabel: string;
  isLoop: boolean;
}

function scheduleDurationMs(entry: ScheduleEntry): number {
  const start = new Date(entry.startsAt);
  const end = new Date(entry.endsAt);
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    return Math.max(60_000, end.getTime() - start.getTime());
  }
  const card = scheduleEntryToEventCard(entry);
  return Math.max(60_000, card.duration * 60_000);
}

function isRecurring(entry: ScheduleEntry): boolean {
  const recurrence = String(entry.recurrence || "ONCE").toUpperCase();
  return recurrence === "DAILY" || Boolean(entry.loopPlayback);
}

function occurrenceOnDay(
  entry: ScheduleEntry,
  day: Date
): { startsAt: Date; endsAt: Date } | null {
  const templateStart = new Date(entry.startsAt);
  if (Number.isNaN(templateStart.getTime())) return null;

  const durationMs = scheduleDurationMs(entry);

  if (!isRecurring(entry)) {
    const startsAt = templateStart;
    const endsAt = Number.isNaN(new Date(entry.endsAt).getTime())
      ? new Date(startsAt.getTime() + durationMs)
      : new Date(entry.endsAt);
    return { startsAt, endsAt };
  }

  const startsAt = new Date(day);
  startsAt.setHours(
    templateStart.getHours(),
    templateStart.getMinutes(),
    templateStart.getSeconds(),
    0
  );
  const endsAt = new Date(startsAt.getTime() + durationMs);
  return { startsAt, endsAt };
}

function expandOccurrences(
  entry: ScheduleEntry,
  horizonDays: number,
  now = new Date()
): Array<{ startsAt: Date; endsAt: Date }> {
  const results: Array<{ startsAt: Date; endsAt: Date }> = [];

  if (!isRecurring(entry)) {
    const once = occurrenceOnDay(entry, now);
    if (once && once.endsAt.getTime() >= now.getTime()) {
      results.push(once);
    }
    return results;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    const occ = occurrenceOnDay(entry, day);
    if (occ && occ.endsAt.getTime() >= now.getTime()) {
      results.push(occ);
    }
  }

  return results;
}

function resolveLocation(
  entry: ScheduleEntry,
  playersById: Map<string, PlayerInfo>
): string {
  return (
    playersById.get(entry.playerId)?.roomName?.trim() ||
    playersById.get(entry.playerId)?.playerName?.trim() ||
    entry.playerName?.trim() ||
    entry.playerId
  );
}

function toSnapshotItem(
  entry: ScheduleEntry,
  occurrence: { startsAt: Date; endsAt: Date },
  playersById: Map<string, PlayerInfo>,
  now: Date
): ScheduleSnapshotItem {
  const card = scheduleEntryToEventCard(entry);
  const active =
    occurrence.startsAt.getTime() <= now.getTime() &&
    occurrence.endsAt.getTime() >= now.getTime();

  return {
    id: `${entry.id}-${formatLocalIsoDate(occurrence.startsAt)}`,
    title: entry.title,
    location: resolveLocation(entry, playersById),
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    durationMinutes: Math.max(
      1,
      Math.round((occurrence.endsAt.getTime() - occurrence.startsAt.getTime()) / 60_000)
    ),
    recurrence: entry.recurrence,
    phase: active ? "active" : "upcoming",
    roomId: entry.playerId,
    timeLabel: card.time,
    isLoop: isRecurring(entry),
  };
}

/** Schedules visible on the schedule page for the current calendar week. */
function weekVisibleOccurrences(
  entry: ScheduleEntry,
  playersById: Map<string, PlayerInfo>,
  now: Date
): ScheduleSnapshotItem[] {
  const weekDates = new Set(buildWeekDays(now).map((d) => d.date));
  const card = scheduleEntryToEventCard(entry);
  const calDate =
    card.calendarDate || formatLocalIsoDate(new Date(entry.startsAt));

  if (!weekDates.has(calDate)) return [];

  const startsAt = new Date(entry.startsAt);
  const endsAt = Number.isNaN(new Date(entry.endsAt).getTime())
    ? new Date(startsAt.getTime() + scheduleDurationMs(entry))
    : new Date(entry.endsAt);

  if (Number.isNaN(startsAt.getTime())) return [];

  return [toSnapshotItem(entry, { startsAt, endsAt }, playersById, now)];
}

/** Dashboard + operations overview: same sources as the schedule calendar. */
export function buildScheduleSnapshot(
  schedules: ScheduleEntry[],
  players: PlayerInfo[],
  limit = 6
): ScheduleSnapshotItem[] {
  const playersById = new Map(players.map((p) => [p.id, p]));
  const now = new Date();
  const seen = new Set<string>();

  const addItem = (item: ScheduleSnapshotItem, bucket: ScheduleSnapshotItem[]) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    bucket.push(item);
  };

  const items: ScheduleSnapshotItem[] = [];

  for (const entry of schedules) {
    for (const occ of expandOccurrences(entry, 7, now)) {
      addItem(toSnapshotItem(entry, occ, playersById, now), items);
    }
    for (const item of weekVisibleOccurrences(entry, playersById, now)) {
      addItem(item, items);
    }
  }

  const todayIso = formatLocalIsoDate(now);
  items.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase === "active" ? -1 : 1;
    const aToday = formatLocalIsoDate(a.startsAt) === todayIso;
    const bToday = formatLocalIsoDate(b.startsAt) === todayIso;
    if (aToday !== bToday) return aToday ? -1 : 1;
    return a.startsAt.getTime() - b.startsAt.getTime();
  });

  return items.slice(0, limit);
}

/** Count distinct schedules with at least one occurrence today. */
export function countTodayBroadcasts(
  schedules: ScheduleEntry[],
  now = new Date()
): number {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  let count = 0;
  for (const entry of schedules) {
    const occ = occurrenceOnDay(entry, todayStart);
    if (!occ) continue;
    if (occ.startsAt < todayEnd && occ.endsAt > todayStart) {
      count += 1;
    }
  }
  return count;
}
