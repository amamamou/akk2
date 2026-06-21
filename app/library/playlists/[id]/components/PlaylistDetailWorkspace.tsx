"use client";

import React, { useMemo } from "react";
import {
  ChevronLeft,
  Disc3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import type { Playlist } from "@/app/library/components/PlaylistModal";
import type { PlaylistTrackInfo } from "@/types/api";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardCommandLayout,
  dashboardHeroSectionClass,
  dashboardLinkAction,
  dashboardMainColumn,
  dashboardMetricAccent,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
  dashboardSidebarColumn,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import {
  formatRelativeDate,
  formatTrackDuration,
  resolvePlaylistDuration,
} from "./playlist-cover-utils";
import type { TrackPreviewState } from "./playlist-detail-types";
import PlaylistCoverArt from "./PlaylistCoverArt";
import TrackPlayButton from "./TrackPlayButton";
import PlaylistQuickActions from "./PlaylistQuickActions";

function TrackRow({
  track,
  index,
  preview,
  removing,
  onPreviewPlay,
  onRemove,
}: {
  track: PlaylistTrackInfo;
  index: number;
  preview?: TrackPreviewState;
  removing?: boolean;
  onPreviewPlay: () => void;
  onRemove: () => void;
}) {
  const isPreviewing = preview?.isPreviewing ?? false;
  const hasError = isPreviewing && !!preview?.streamError;

  return (
    <div
      className={cn(
        "group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[32px_36px_1fr_64px_36px] sm:gap-4 sm:px-5",
        "border-b border-gray-100 last:border-b-0 dark:border-zinc-800/80",
        "transition-colors hover:bg-[#A473FF]/[0.04] dark:hover:bg-[#A473FF]/[0.06]",
        isPreviewing && !hasError && "bg-[#A473FF]/[0.04] dark:bg-[#A473FF]/[0.06]"
      )}
    >
      {isPreviewing && !hasError && (
        <span
          className="absolute bottom-0 left-0 top-0 w-0.5 bg-[#A473FF]"
          aria-hidden
        />
      )}

      <span className="hidden text-center text-xs tabular-nums text-gray-400 sm:block">
        {index + 1}
      </span>

      <TrackPlayButton
        isPreviewing={isPreviewing}
        hasError={hasError}
        onClick={onPreviewPlay}
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
          {track.title}
        </p>
        {hasError && (
          <p className="mt-0.5 truncate text-xs text-amber-700 dark:text-amber-400">
            {preview?.streamError}
          </p>
        )}
      </div>

      <span className="hidden text-right text-xs tabular-nums text-gray-400 sm:block">
        {formatTrackDuration(track.duration)}
      </span>

      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove ${track.title}`}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors",
          "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
          removing && "cursor-wait opacity-50"
        )}
      >
        {removing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

function ProgramSidebar({
  playlist,
  relativeUpdated,
  displayDuration,
}: {
  playlist: Playlist;
  relativeUpdated: string | null;
  displayDuration: string | null;
}) {
  return (
    <aside className={cn(dashboardCardClass, "p-5")}>
      <p className={dashboardSectionLabel}>Program details</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-500 dark:text-zinc-400">Tracks</dt>
          <dd className={cn("font-medium tabular-nums", dashboardMetricAccent)}>
            {playlist.trackCount}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-500 dark:text-zinc-400">Duration</dt>
          <dd className={cn("font-medium tabular-nums", dashboardMetricAccent)}>
            {displayDuration ?? "—"}
          </dd>
        </div>
        {relativeUpdated ? (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-zinc-800">
            <dt className="text-gray-500 dark:text-zinc-400">Updated</dt>
            <dd className="text-right text-xs text-gray-600 dark:text-zinc-300">
              {relativeUpdated}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
        Preview tracks from the list. Playback controls appear in the player at the bottom of the
        screen.
      </p>
    </aside>
  );
}

export default function PlaylistDetailWorkspace({
  playlist,
  tracks,
  trackQuery,
  onTrackQueryChange,
  removingId,
  getPreview,
  onPreviewPlay,
  onRemove,
  onAddTracks,
  onEdit,
  onDelete,
  deleteLoading = false,
}: {
  playlist: Playlist;
  tracks: PlaylistTrackInfo[];
  trackQuery: string;
  onTrackQueryChange: (q: string) => void;
  removingId?: string | null;
  getPreview: (trackId: string) => TrackPreviewState | undefined;
  onPreviewPlay: (track: PlaylistTrackInfo) => void;
  onRemove: (track: PlaylistTrackInfo) => void;
  onAddTracks: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteLoading?: boolean;
}) {
  const relativeUpdated = formatRelativeDate(playlist.lastModified);

  const filteredTracks = useMemo(() => {
    const q = trackQuery.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tracks, trackQuery]);

  const displayDuration = useMemo(
    () => resolvePlaylistDuration(playlist.totalDuration, tracks),
    [playlist.totalDuration, tracks]
  );

  return (
    <>
      <Link
        href="/library/playlists"
        className={cn(dashboardLinkAction, "inline-flex items-center gap-1 text-sm")}
      >
        <ChevronLeft size={15} strokeWidth={2} />
        Playlists
      </Link>

      <section className={dashboardHeroSectionClass}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-5">
            <PlaylistCoverArt playlist={playlist} className="h-[72px] w-[72px]" />

            <div className="min-w-0 space-y-1.5 pt-0.5">
              <p className={dashboardSectionLabel}>Library · Playback program</p>
              <h1
                className={cn(
                  dashboardPanelTitle,
                  "text-[28px] font-semibold leading-tight sm:text-[32px]"
                )}
              >
                {playlist.title}
              </h1>
              {playlist.description ? (
                <p className={cn(dashboardPanelSubtitle, "max-w-2xl text-sm leading-relaxed")}>
                  {playlist.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={onAddTracks}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-opacity hover:opacity-90",
                dashboardAccentShadow
              )}
              style={{
                background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add tracks
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:border-[#A473FF]/30 hover:bg-[#A473FF]/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#A473FF]/30 dark:hover:bg-[#A473FF]/10"
            >
              <Pencil size={15} strokeWidth={1.9} />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteLoading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-rose-600 transition-colors hover:border-[#A473FF]/30 hover:bg-[#A473FF]/5 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-rose-400 dark:hover:border-[#A473FF]/30 dark:hover:bg-[#A473FF]/10"
            >
              <Trash2 size={15} strokeWidth={1.9} />
              Delete
            </button>
          </div>
        </div>
      </section>

      <div className={dashboardCommandLayout}>
        <div className={dashboardMainColumn}>
          <section className={cn(dashboardCardClass, "overflow-hidden")}>
            <header className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className={dashboardPanelTitle}>Tracks</h2>
                <p className={dashboardPanelSubtitle}>
                  {tracks.length === 0
                    ? "No tracks in this program yet"
                    : filteredTracks.length === tracks.length
                      ? `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}`
                      : `${filteredTracks.length} of ${tracks.length} shown`}
                </p>
              </div>

              {tracks.length > 0 && (
                <div className="relative w-full sm:max-w-[220px]">
                  <Search
                    size={14}
                    strokeWidth={1.9}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={trackQuery}
                    onChange={(e) => onTrackQueryChange(e.target.value)}
                    placeholder="Search tracks…"
                    aria-label="Search tracks"
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  {trackQuery && (
                    <button
                      type="button"
                      onClick={() => onTrackQueryChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear filter"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              )}
            </header>

            {tracks.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#A473FF]/8 text-[#8B5CF6] ring-1 ring-[#A473FF]/10 dark:bg-[#A473FF]/12">
                  <Disc3 size={18} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium text-gray-950 dark:text-zinc-100">
                  No tracks yet
                </p>
                <p className="mt-1 max-w-xs text-xs text-gray-500">
                  Add audio from your library to build this playback program.
                </p>
                <button
                  type="button"
                  onClick={onAddTracks}
                  className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{
                    background:
                      "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
                  }}
                >
                  <Plus size={15} strokeWidth={2} />
                  Add tracks
                </button>
              </div>
            ) : filteredTracks.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-gray-500">
                No tracks match &ldquo;{trackQuery}&rdquo;
              </p>
            ) : (
              <>
                <div className="hidden border-b border-gray-100 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:border-zinc-800 sm:grid sm:grid-cols-[32px_36px_1fr_64px_36px] sm:gap-4 sm:px-6">
                  <span className="text-center">#</span>
                  <span />
                  <span>Title</span>
                  <span className="text-right">Duration</span>
                  <span />
                </div>
                <div className="relative">
                  {filteredTracks.map((track) => {
                    const index = tracks.findIndex((t) => t.id === track.id);
                    return (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index >= 0 ? index : 0}
                        preview={getPreview(track.id)}
                        removing={removingId === track.id}
                        onPreviewPlay={() => onPreviewPlay(track)}
                        onRemove={() => onRemove(track)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        <div className={cn(dashboardSidebarColumn, "space-y-4 lg:sticky lg:top-6")}>
          <ProgramSidebar
            playlist={playlist}
            relativeUpdated={relativeUpdated}
            displayDuration={displayDuration}
          />
          <PlaylistQuickActions onAddTracks={onAddTracks} onEdit={onEdit} />
        </div>
      </div>
    </>
  );
}
