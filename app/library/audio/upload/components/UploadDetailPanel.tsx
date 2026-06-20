"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  HardDrive,
  Layers,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Tag,
  Type,
} from "lucide-react";
import {
  dashboardCardClass,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import { LIBRARY_TAG_FILTERS } from "@/lib/audio-library-tags";
import { formatMediaTime } from "@/app/library/playlists/[id]/components/playlist-cover-utils";
import type { UploadQueueItem } from "../lib/upload-audio-types";
import {
  UPLOAD_CATEGORIES,
  UPLOAD_FIELD_GUIDANCE,
  buildReviewSummary,
  formatUploadFileSize,
  getUploadFieldErrors,
  isQueueItemValid,
} from "../lib/upload-audio-utils";
import {
  FieldError,
  FieldHelper,
  FieldLabel,
  fieldInputClass,
} from "./UploadFormField";

export default function UploadDetailPanel({
  item,
  playlists,
  showValidation,
  onChange,
  titleRef,
}: {
  item: UploadQueueItem;
  playlists: Array<{ id: string; name: string }>;
  showValidation: boolean;
  onChange: (patch: Partial<UploadQueueItem>) => void;
  titleRef: React.RefObject<HTMLInputElement | null>;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(item.durationSeconds ?? 0);

  const errors = getUploadFieldErrors(item);
  const showTitleError = (showValidation || item.titleTouched) && errors.title;
  const showArtistError = (showValidation || item.artistTouched) && errors.artist;
  const showCategoryError = (showValidation || item.categoryTouched) && errors.category;

  useEffect(() => {
    setPlaying(false);
    setDuration(item.durationSeconds ?? 0);
  }, [item.id, item.durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sync = () => setPlaying(!audio.paused && !audio.ended);
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);
    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", sync);
    };
  }, [item.previewUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const tagSuggestions = LIBRARY_TAG_FILTERS.filter((t) => !(item.tags ?? []).includes(t));
  const reviewReady = isQueueItemValid(item);

  return (
    <div className="space-y-6">
      <section className={cn(dashboardCardClass, "p-5 sm:p-6")}>
        <p className={dashboardSectionLabel}>Preview</p>
        <div className="mt-3 flex items-start gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-white transition-opacity hover:opacity-90"
          >
            {playing ? (
              <Pause size={14} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={14} className="ml-0.5" fill="currentColor" strokeWidth={0} />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
              {item.title.trim() || item.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {item.artist.trim() || "Add artist below"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <HardDrive size={12} />
                {formatUploadFileSize(item.size)}
              </span>
              {duration > 0 && <span>{formatMediaTime(duration)}</span>}
              <span className="truncate">{item.name}</span>
            </div>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={item.previewUrl}
          preload="metadata"
          className="sr-only"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
              if (item.durationSeconds == null) {
                onChange({ durationSeconds: d });
              }
            }
          }}
        />
      </section>

      <section className={cn(dashboardCardClass, "p-5 sm:p-6")}>
        <div className="mb-4">
          <h2 className={dashboardPanelTitle}>Metadata</h2>
          <p className={dashboardPanelSubtitle}>
            Fields marked with <span className="text-[#A473FF]">*</span> are required to import
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <FieldLabel icon={Type} label="Title" required />
            <input
              ref={titleRef}
              value={item.title}
              maxLength={100}
              onChange={(e) => onChange({ title: e.target.value })}
              onBlur={() => onChange({ titleTouched: true })}
              placeholder="Track title"
              aria-invalid={!!showTitleError}
              aria-describedby={showTitleError ? "upload-title-error" : "upload-title-help"}
              className={fieldInputClass(!!showTitleError)}
            />
            {showTitleError ? (
              <FieldError message={errors.title!} />
            ) : (
              <FieldHelper>{UPLOAD_FIELD_GUIDANCE.title}</FieldHelper>
            )}
          </div>

          <div>
            <FieldLabel icon={Mic2} label="Artist" required />
            <input
              value={item.artist}
              maxLength={60}
              onChange={(e) => onChange({ artist: e.target.value })}
              onBlur={() => onChange({ artistTouched: true })}
              placeholder="Artist or performer"
              aria-invalid={!!showArtistError}
              className={fieldInputClass(!!showArtistError)}
            />
            {showArtistError ? (
              <FieldError message={errors.artist!} />
            ) : (
              <FieldHelper>{UPLOAD_FIELD_GUIDANCE.artist}</FieldHelper>
            )}
          </div>

          <div>
            <FieldLabel icon={Layers} label="Category" required />
            <select
              value={item.category}
              onChange={(e) => onChange({ category: e.target.value, categoryTouched: true })}
              onBlur={() => onChange({ categoryTouched: true })}
              aria-invalid={!!showCategoryError}
              className={fieldInputClass(!!showCategoryError)}
            >
              <option value="">Select a category</option>
              {UPLOAD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {showCategoryError ? (
              <FieldError message={errors.category!} />
            ) : (
              <FieldHelper>{UPLOAD_FIELD_GUIDANCE.category}</FieldHelper>
            )}
          </div>

          <div>
            <FieldLabel icon={Tag} label="Tags" optional />
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(item.tags ?? []).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    onChange({ tags: (item.tags ?? []).filter((t) => t !== tag) })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-[#A473FF]/10 px-2.5 py-1 text-xs font-medium text-[#7C3AED] ring-1 ring-[#A473FF]/15 dark:text-[#A473FF]"
                >
                  {tag}
                  <span aria-hidden>×</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onChange({ tags: [...(item.tags ?? []), tag] })}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel icon={ListMusic} label="Add to playlist" optional />
            <select
              value={item.playlistId ?? ""}
              onChange={(e) => onChange({ playlistId: e.target.value || null })}
              className={fieldInputClass(false)}
            >
              <option value="">None</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <FieldHelper>Add this file to a playlist after import, if you like.</FieldHelper>
          </div>
        </div>
      </section>

      <section className={cn(dashboardCardClass, "p-5 sm:p-6")}>
        <p className={dashboardSectionLabel}>Review</p>
        {reviewReady ? (
          <div className="mt-2 flex items-start gap-2">
            <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
            <div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">{buildReviewSummary(item)}</p>
              {item.playlistId && (
                <p className="mt-1 text-xs text-gray-400">
                  Will be added to{" "}
                  {playlists.find((p) => p.id === item.playlistId)?.name ?? "selected playlist"}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
              <p className="font-medium">Complete required fields before importing</p>
              <ul className="list-inside list-disc space-y-0.5 text-amber-700/90 dark:text-amber-300/90">
                {errors.title && <li>{errors.title}</li>}
                {errors.artist && <li>{errors.artist}</li>}
                {errors.category && <li>{errors.category}</li>}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
