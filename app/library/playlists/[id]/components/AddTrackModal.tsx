"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Check, Loader2, Pause, Play, Plus, Search, X } from "lucide-react";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardMutedSurface,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export interface AddTrackOption {
  id: string;
  title: string;
  duration?: string;
}

function rowStatus(
  mediaId: string,
  existingMediaIds: Set<string>,
  initialMediaIds: Set<string>
): "available" | "added" | "in-playlist" {
  if (!existingMediaIds.has(mediaId)) return "available";
  if (initialMediaIds.has(mediaId)) return "in-playlist";
  return "added";
}

function ModalPreviewButton({
  canPreview,
  isPlaying,
  onToggle,
}: {
  canPreview: boolean;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!canPreview}
      aria-label={
        !canPreview
          ? "Preview unavailable"
          : isPlaying
            ? "Pause preview"
            : "Preview audio"
      }
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
        "text-gray-400 hover:bg-[#A473FF]/8 hover:text-[#8B5CF6]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A473FF]/30 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent",
        isPlaying && "bg-[#A473FF]/10 text-[#8B5CF6]"
      )}
    >
      {isPlaying ? (
        <Pause size={14} fill="currentColor" strokeWidth={0} />
      ) : (
        <Play size={14} className="ml-0.5" strokeWidth={2} />
      )}
    </button>
  );
}

export default function AddTrackModal({
  open,
  onClose,
  options,
  mediaUrls,
  loading,
  existingMediaIds,
  initialMediaIds,
  onAdd,
  addingId,
  sessionAddedCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  options: AddTrackOption[];
  mediaUrls: Record<string, string>;
  loading?: boolean;
  existingMediaIds: Set<string>;
  initialMediaIds: Set<string>;
  onAdd: (mediaId: string) => void;
  addingId?: string | null;
  sessionAddedCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [previewMediaId, setPreviewMediaId] = useState<string | null>(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerAudioRef = useRef<HTMLAudioElement>(null);
  const previewMediaIdRef = useRef<string | null>(null);

  const syncPreviewState = useCallback(() => {
    setPreviewRevision((n) => n + 1);
  }, []);

  useEffect(() => {
    previewMediaIdRef.current = previewMediaId;
  }, [previewMediaId]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    const audio = pickerAudioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setPreviewMediaId(null);
  }, [open]);

  useEffect(() => {
    const audio = pickerAudioRef.current;
    if (!audio || !open) return;

    const onSync = () => syncPreviewState();
    const onEnded = () => {
      setPreviewMediaId(null);
      syncPreviewState();
    };

    audio.addEventListener("play", onSync);
    audio.addEventListener("pause", onSync);
    audio.addEventListener("playing", onSync);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onSync);
      audio.removeEventListener("pause", onSync);
      audio.removeEventListener("playing", onSync);
      audio.removeEventListener("ended", onEnded);
    };
  }, [open, syncPreviewState]);

  const isPreviewPlaying = useCallback(
    (mediaId: string) => {
      void previewRevision;
      const audio = pickerAudioRef.current;
      return (
        previewMediaIdRef.current === mediaId &&
        audio != null &&
        !audio.paused &&
        !audio.ended
      );
    },
    [previewRevision]
  );

  const handlePreviewToggle = useCallback(
    (mediaId: string) => {
      const url = mediaUrls[mediaId]?.trim();
      const audio = pickerAudioRef.current;
      if (!url || !audio) return;

      const isActive = previewMediaIdRef.current === mediaId;
      if (isActive && !audio.paused && !audio.ended) {
        audio.pause();
        syncPreviewState();
        return;
      }

      if (!isActive) {
        audio.src = url;
        setPreviewMediaId(mediaId);
        previewMediaIdRef.current = mediaId;
      }

      void audio.play().then(syncPreviewState).catch(() => syncPreviewState());
    },
    [mediaUrls, syncPreviewState]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.title.toLowerCase().includes(q));
  }, [options, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-track-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden sm:max-h-[80vh]",
          dashboardAccentShadow
        )}
      >
        <header className="border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={dashboardSectionLabel}>From library</p>
              <h2 id="add-track-title" className={cn(dashboardPanelTitle, "mt-1 text-lg")}>
                Add audio
              </h2>
              <p className={cn(dashboardPanelSubtitle, "mt-1")}>
                Preview, search, and add tracks — stay here until you&apos;re done
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-4">
            <Search
              size={15}
              strokeWidth={1.9}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search audio library…"
              aria-label="Search audio library"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </header>

        <div className="min-h-[240px] flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <ul className="space-y-1 px-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-3", dashboardMutedSurface)}
                >
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-2.5 w-12 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#A473FF]/8 text-[#8B5CF6]">
                <AudioLines size={20} />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {query ? "No matching audio" : "Library is empty"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {query
                  ? "Try a different search term"
                  : "Upload audio to your library first"}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((item) => {
                const status = rowStatus(item.id, existingMediaIds, initialMediaIds);
                const isAdding = addingId === item.id;
                const inPlaylist = status !== "available";
                const canPreview = Boolean(mediaUrls[item.id]?.trim());
                const playing = isPreviewPlaying(item.id);

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2 py-2 transition-colors sm:gap-3 sm:px-3 sm:py-2.5",
                      playing && "bg-[#A473FF]/5 dark:bg-[#A473FF]/10",
                      status === "added" && !playing && "bg-emerald-50/50 dark:bg-emerald-950/20",
                      !playing && status !== "added" && "hover:bg-gray-50 dark:hover:bg-zinc-800/60"
                    )}
                  >
                    <ModalPreviewButton
                      canPreview={canPreview}
                      isPlaying={playing}
                      onToggle={() => handlePreviewToggle(item.id)}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
                        {item.title}
                      </p>
                      {item.duration && (
                        <p className="text-xs text-gray-400">{item.duration}</p>
                      )}
                    </div>

                    {status === "in-playlist" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 px-1 text-xs font-medium text-gray-400">
                        <Check size={14} />
                        <span className="hidden sm:inline">In playlist</span>
                      </span>
                    ) : status === "added" ? (
                      <span className="inline-flex shrink-0 items-center gap-1 px-1 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                        <Check size={14} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Added</span>
                      </span>
                    ) : isAdding ? (
                      <span className="inline-flex h-8 w-14 items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-[#A473FF]" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAdd(item.id)}
                        disabled={Boolean(addingId)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium text-[#8B5CF6] transition-colors hover:bg-[#A473FF]/10 disabled:opacity-50"
                      >
                        <Plus size={14} strokeWidth={2} className="shrink-0" />
                        Add
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-3 text-xs text-gray-400 dark:border-zinc-700/60">
          <span>
            {filtered.length} shown · {existingMediaIds.size} in playlist
          </span>
          {sessionAddedCount > 0 && (
            <span className="font-medium text-emerald-600 dark:text-emerald-500">
              {sessionAddedCount} added this session
            </span>
          )}
        </footer>
      </div>

      <audio ref={pickerAudioRef} preload="metadata" className="sr-only" aria-hidden />
    </div>
  );
}
