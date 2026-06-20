import type { MediaInfo, PlayerInfo, ScheduleEntry } from "@/types/api";
import { scheduleEntryToEventCard } from "@/lib/schedule-all-clients";

export type DashboardSearchResult = {
  id: string;
  type: "player" | "venue" | "schedule" | "media";
  label: string;
  meta: string;
  href: string;
};

function matches(query: string, ...parts: (string | undefined | null)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return parts.some((p) => p?.toLowerCase().includes(q));
}

export function searchDashboard(
  query: string,
  players: PlayerInfo[],
  schedules: ScheduleEntry[],
  media: MediaInfo[],
  limit = 8
): DashboardSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DashboardSearchResult[] = [];

  for (const player of players) {
    const venue = player.roomName?.trim();
    const name = player.playerName?.trim();
    if (matches(q, venue, name, player.id, player.macAddress)) {
      results.push({
        id: `player-${player.id}`,
        type: "player",
        label: venue || name || player.id,
        meta: name && venue ? name : "Player",
        href: `/players?highlight=${encodeURIComponent(player.id)}`,
      });
    }
  }

  for (const schedule of schedules) {
    const card = scheduleEntryToEventCard(schedule);
    const location = schedule.playerName?.trim();
    if (matches(q, schedule.title, location, card.time)) {
      results.push({
        id: `schedule-${schedule.id}`,
        type: "schedule",
        label: schedule.title,
        meta: `${card.time}${location ? ` · ${location}` : ""}`,
        href: `/schedule`,
      });
    }
  }

  for (const item of media) {
    if (matches(q, item.title, item.category, item.id)) {
      results.push({
        id: `media-${item.id}`,
        type: "media",
        label: item.title,
        meta: item.category || "Audio",
        href: `/library`,
      });
    }
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).slice(0, limit);
}
