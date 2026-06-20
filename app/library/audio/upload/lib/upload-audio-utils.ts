import type { UploadQueueItem } from "./upload-audio-types";

export const UPLOAD_CATEGORIES = [
  "Audio",
  "Ambient",
  "Announcements",
  "Electronic",
  "Pop",
  "Voiceover",
] as const;

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/mp4",
  "audio/aac",
  "application/octet-stream",
];

export function formatUploadFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 10) return `${mb.toFixed(1)} MB`;
  return `${Math.round(mb)} MB`;
}

export function suggestTitleAndArtist(filename: string): { title: string; artist: string } {
  const stem = filename.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
  const dashMatch = stem.match(/^(.+?)\s[-–—]\s(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
  }
  return { title: stem, artist: "" };
}

export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    const cleanup = () => {
      URL.revokeObjectURL(url);
    };
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      resolve(Number.isFinite(duration) && duration > 0 ? duration : null);
    };
    audio.onerror = () => {
      cleanup();
      resolve(null);
    };
    audio.src = url;
  });
}

export function validateAudioFile(file: File): string | null {
  const isAudio =
    file.type.startsWith("audio/") || ACCEPTED_AUDIO_TYPES.includes(file.type);
  if (!isAudio && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
    return "Unsupported file type. Use MP3, WAV, OGG, or M4A.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File exceeds 100 MB limit.";
  }
  if (file.size <= 0) {
    return "File is empty.";
  }
  return null;
}

export function durationToUploadMinutes(seconds: number | null, sizeBytes: number): number {
  if (seconds != null && seconds > 0) {
    return Math.max(1, Math.round(seconds / 60));
  }
  return Math.max(1, Math.round(sizeBytes / (1024 * 1024)));
}

export function sanitizeUploadStem(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^a-zA-Z0-9 _-]/g, "_").replace(/\s+/g, "_");
}

export type UploadFieldKey = "title" | "artist" | "category";

export type UploadFieldErrors = Partial<Record<UploadFieldKey, string>>;

export const UPLOAD_FIELD_GUIDANCE: Record<UploadFieldKey, string> = {
  title: "Use a clear title so this track is easy to find in your library.",
  artist: "Artist helps identify tracks in playlists and search results.",
  category: "Select a category to organize this audio in the library.",
};

export function getUploadFieldErrors(item: UploadQueueItem): UploadFieldErrors {
  const errors: UploadFieldErrors = {};
  if (!item.title.trim()) {
    errors.title = "Title is required";
  }
  if (!item.artist.trim()) {
    errors.artist = "Artist is required";
  }
  const category = item.category.trim();
  if (
    !category ||
    !UPLOAD_CATEGORIES.includes(category as (typeof UPLOAD_CATEGORIES)[number])
  ) {
    errors.category = "Category is required";
  }
  return errors;
}

export function isQueueItemValid(item: UploadQueueItem): boolean {
  return Object.keys(getUploadFieldErrors(item)).length === 0;
}

export function isQueueItemReady(item: UploadQueueItem): boolean {
  return isQueueItemValid(item) && item.status !== "uploading";
}

export function countInvalidQueueItems(items: UploadQueueItem[]): number {
  return items.filter((item) => item.status !== "success" && !isQueueItemValid(item)).length;
}

export function getSubmitBlockMessage(items: UploadQueueItem[]): string | null {
  const pending = items.filter((i) => i.status !== "success");
  if (pending.length === 0) return null;
  const invalid = pending.filter((i) => !isQueueItemValid(i));
  if (invalid.length === 0) return null;

  if (invalid.length === 1) {
    const errors = getUploadFieldErrors(invalid[0]!);
    const keys = Object.keys(errors) as UploadFieldKey[];
    if (keys.length === 1) return errors[keys[0]!] ?? "Complete required fields";
    return "Complete required fields";
  }

  return `Complete required fields for ${invalid.length} files`;
}

export function buildReviewSummary(item: UploadQueueItem): string {
  const parts = [
    item.title.trim() || item.name,
    item.artist.trim() || "Unknown artist",
    item.category,
    formatUploadFileSize(item.size),
  ];
  if (item.durationSeconds != null) {
    const m = Math.floor(item.durationSeconds / 60);
    const s = Math.floor(item.durationSeconds % 60)
      .toString()
      .padStart(2, "0");
    parts.push(`${m}:${s}`);
  }
  return parts.join(" · ");
}
