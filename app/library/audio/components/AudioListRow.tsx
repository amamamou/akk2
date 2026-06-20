"use client";

import React from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { AudioItem } from "@/app/library/components/AudioTile";
import { cn } from "@/utils/cn";
import { formatFileSize, resolveArtistLabel } from "../lib/audio-library-utils";
import TrackPlayButton from "../../playlists/[id]/components/TrackPlayButton";

export type AudioRowPreviewState = {
  isPreviewing: boolean;
  isPlaying: boolean;
  streamError: string | null;
};

export default function AudioListRow({
  item,
  preview,
  onPreview,
  onEdit,
  onDelete,
  deleting,
}: {
  item: AudioItem;
  preview?: AudioRowPreviewState;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  const isPreviewing = preview?.isPreviewing ?? false;
  const hasError = isPreviewing && !!preview?.streamError;
  const sizeLabel = formatFileSize(item.size);
  const artistLabel = resolveArtistLabel(item.singer);

  return (
    <div
      className={cn(
        "group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[36px_1fr_64px_72px_72px] sm:gap-4 sm:px-5",
        "border-b border-gray-100 last:border-b-0 dark:border-zinc-800/80",
        "transition-colors hover:bg-[#A473FF]/[0.04] dark:hover:bg-[#A473FF]/[0.06]",
        isPreviewing && !hasError && "bg-[#A473FF]/[0.04] dark:bg-[#A473FF]/[0.06]"
      )}
    >
      {isPreviewing && !hasError && (
        <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-[#A473FF]" aria-hidden />
      )}

      <TrackPlayButton
        isPreviewing={isPreviewing}
        hasError={hasError}
        onClick={onPreview}
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-400">{artistLabel}</p>
        {hasError && (
          <p className="mt-0.5 truncate text-xs text-amber-700 dark:text-amber-400">
            {preview?.streamError}
          </p>
        )}
      </div>

      <span className="hidden text-right text-xs tabular-nums text-gray-400 sm:block">
        {item.duration}
      </span>

      <span className="hidden text-right text-xs tabular-nums text-gray-400 sm:block">
        {sizeLabel ?? "—"}
      </span>

      <div className="flex items-center justify-end gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${item.title}`}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors",
            "hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          )}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete ${item.title}`}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors",
            "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            deleting && "cursor-wait opacity-50"
          )}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}
