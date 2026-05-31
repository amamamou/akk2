import type { PlaylistApiInfo } from "@/types/api";
import type { Playlist } from "@/app/library/components/PlaylistModal";

export function apiPlaylistToUi(p: PlaylistApiInfo): Playlist {
  const cover = (p.coverColor || "indigo") as Playlist["coverColor"];
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? undefined,
    trackCount: p.trackCount ?? 0,
    totalDuration: p.totalDuration ?? "0m",
    usedInSchedule: false,
    spacesCount: 0,
    lastModified: p.lastModified ?? new Date().toISOString(),
    coverColor: cover ?? "indigo",
  };
}
