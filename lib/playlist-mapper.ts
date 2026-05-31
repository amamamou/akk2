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
    totalDuration: String(row.totalDuration ?? row.total_duration ?? "0m"),
    usedInSchedule: false,
    spacesCount: 0,
    lastModified: String(
      row.lastModified ?? row.last_modified ?? new Date().toISOString()
    ),
    coverColor: cover ?? "indigo",
  };
}
