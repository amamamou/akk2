export const coverGradients = {
  indigo: "from-indigo-500 via-indigo-600 to-indigo-900",
  blue: "from-blue-500 via-blue-600 to-blue-900",
  purple: "from-[#7C3AED] via-[#8B5CF6] to-[#202538]",
  slate: "from-slate-500 via-slate-600 to-slate-900",
  gray: "from-zinc-500 via-zinc-600 to-zinc-900",
  emerald: "from-emerald-500 via-emerald-600 to-emerald-900",
} as const;

export type CoverGradientKey = keyof typeof coverGradients;

export function resolveCoverGradient(color?: string | null): string {
  if (color && color in coverGradients) {
    return coverGradients[color as CoverGradientKey];
  }
  return coverGradients.indigo;
}

export function formatTrackDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatMediaTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelativeDate(iso: string): string | null {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 1) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSecondsAsDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

/** Resolves display duration from playlist metadata or track lengths. */
export function resolvePlaylistDuration(
  totalDuration: string | undefined,
  tracks: { duration?: number }[]
): string | null {
  if (totalDuration && totalDuration !== "0m") return totalDuration;
  const seconds = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  if (seconds <= 0) return null;
  return formatSecondsAsDuration(seconds);
}
