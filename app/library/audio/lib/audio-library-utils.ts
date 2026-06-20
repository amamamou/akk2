import type { AudioItem } from "@/app/library/components/AudioTile";

export type AudioSortKey =
  | "title-asc"
  | "title-desc"
  | "duration-desc"
  | "duration-asc"
  | "size-desc"
  | "size-asc";

export type AudioSizeFilterKey = "all" | "small" | "medium" | "large";

export type AudioCategoryFilterKey = string;

const MB = 1024 * 1024;

export function formatFileSize(bytes?: number): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return null;
  const mb = bytes / MB;
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  if (mb < 10) return `${mb.toFixed(1)} MB`;
  return `${Math.round(mb)} MB`;
}

export function matchesSizeFilter(
  sizeBytes: number | undefined,
  filter: AudioSizeFilterKey
): boolean {
  if (filter === "all") return true;
  if (sizeBytes == null || !Number.isFinite(sizeBytes)) return false;
  const mb = sizeBytes / MB;
  if (filter === "small") return mb < 5;
  if (filter === "medium") return mb >= 5 && mb <= 20;
  return mb > 20;
}

export function sortAudioItems(items: AudioItem[], sort: AudioSortKey): AudioItem[] {
  const sorted = [...items];
  switch (sort) {
    case "title-asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "duration-desc":
      sorted.sort((a, b) => (b.durationMinutes ?? 0) - (a.durationMinutes ?? 0));
      break;
    case "duration-asc":
      sorted.sort((a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0));
      break;
    case "size-desc":
      sorted.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
      break;
    case "size-asc":
      sorted.sort((a, b) => (a.size ?? 0) - (b.size ?? 0));
      break;
  }
  return sorted;
}

export function searchAudioItems(items: AudioItem[], query: string): AudioItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [
      item.title,
      item.category,
      item.singer,
      ...(item.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getCategoryOptions(items: AudioItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.category?.trim()) set.add(item.category.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function resolveArtistLabel(singer?: string): string {
  const value = singer?.trim();
  return value || "Unknown artist";
}
