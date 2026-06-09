import type { PlaylistApiInfo } from "@/types/api";
import type { Playlist } from "@/app/library/components/PlaylistModal";

/** Unified playlist id from API / cache payloads (always lowercase `id` first). */
export function resolvePlaylistId(
  source: PlaylistApiInfo | Record<string, unknown>
): string | null {
  const row = source as Record<string, unknown>;
  const raw = row.id ?? row.playlist_id ?? row.playlistId ?? row._id;
  if (raw == null) return null;
  const id = String(raw).trim();
  if (!id || id === "undefined") return null;
  return id;
}

export function isValidPlaylistId(
  id: string | undefined | null
): id is string {
  return typeof id === "string" && id.length > 0 && id !== "undefined";
}

/** Format a second count as "Xh Ym" / "Ym" — mirrors the backend `_format_duration`. */
function formatDurationFromSeconds(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** Sum the `duration` (seconds) of a tracks array, ignoring malformed entries. */
function sumTrackSeconds(tracks: unknown): number {
  if (!Array.isArray(tracks)) return 0;
  return tracks.reduce<number>((acc, t) => {
    const d = Number((t as { duration?: unknown } | null)?.duration ?? 0);
    return acc + (Number.isFinite(d) && d > 0 ? d : 0);
  }, 0);
}

/**
 * Resolve a playlist's display duration. Prefers the server-formatted string, but when that
 * is missing/null/"0m" it derives the value from the aggregate seconds (or by reducing the
 * local `tracks` durations) instead of blindly emitting a static "0m".
 */
function resolveTotalDuration(row: Record<string, unknown>): string {
  const explicit = row.totalDuration ?? row.total_duration;
  if (typeof explicit === "string") {
    const trimmed = explicit.trim();
    if (trimmed && trimmed !== "0m") return trimmed;
  }

  const seconds =
    Number(row.totalDurationSeconds ?? row.total_duration_seconds ?? 0) ||
    sumTrackSeconds(row.tracks);

  return seconds > 0 ? formatDurationFromSeconds(seconds) : "0m";
}

export function apiPlaylistToUi(
  p: PlaylistApiInfo | Record<string, unknown>
): Playlist | null {
  const id = resolvePlaylistId(p);
  if (!id) return null;

  const row = p as Record<string, unknown>;
  const cover = String(row.coverColor ?? row.cover_color ?? "indigo") as Playlist["coverColor"];

  return {
    id,
    title: String(row.title ?? "Untitled"),
    description: (row.description as string | undefined) ?? undefined,
    trackCount: Number(row.trackCount ?? row.track_count ?? 0),
    totalDuration: resolveTotalDuration(row),
    usedInSchedule: false,
    spacesCount: 0,
    lastModified: String(
      row.lastModified ?? row.last_modified ?? new Date().toISOString()
    ),
    coverColor: cover ?? "indigo",
  };
}
