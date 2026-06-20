"use client";

import React, { useRef } from "react";
import { AlertCircle, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatMediaTime } from "./playlist-cover-utils";
import type { PreviewPlayerState } from "./playlist-detail-types";
import PlaybackEqualizer from "./PlaybackEqualizer";

export default function PreviewPlayer({
  state,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
}: {
  state: PreviewPlayerState;
  volume: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}) {
  const progressRef = useRef<HTMLDivElement>(null);
  const muted = volume === 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = progressRef.current;
    if (!el || state.duration <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * state.duration);
  };

  return (
    <div
      role="region"
      aria-label="Audio preview player"
      className={cn(
        "fixed bottom-5 left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-lg -translate-x-1/2",
        "rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
        "dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-none",
        state.isPlaying && "border-[#A473FF]/20 dark:border-[#A473FF]/25"
      )}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPlayPause}
          aria-label={state.isPlaying ? "Pause preview" : "Play preview"}
          aria-pressed={state.isPlaying}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90",
            "bg-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A473FF]/40 focus-visible:ring-offset-2"
          )}
        >
          {state.isPlaying ? (
            <Pause size={14} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={14} className="ml-0.5" fill="currentColor" strokeWidth={0} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {state.isPlaying && !state.streamError && (
              <PlaybackEqualizer active size="xs" barClassName="bg-[#A473FF]" className="shrink-0" />
            )}
            <p className="min-w-0 truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
              {state.trackTitle}
            </p>
          </div>

          {state.streamError ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle size={12} />
              {state.streamError}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-3">
              <div
                ref={progressRef}
                role="slider"
                aria-label="Preview progress"
                aria-valuemin={0}
                aria-valuemax={Math.round(state.duration)}
                aria-valuenow={Math.round(state.currentTime)}
                tabIndex={0}
                onClick={handleProgressClick}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") onSeek(Math.min(state.duration, state.currentTime + 5));
                  if (e.key === "ArrowLeft") onSeek(Math.max(0, state.currentTime - 5));
                }}
                className="h-1 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-full bg-[#A473FF]/10 dark:bg-[#A473FF]/15"
              >
                <div
                  className="h-full bg-[#A473FF] transition-[width] duration-75"
                  style={{ width: `${state.progressPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                {formatMediaTime(state.currentTime)} / {formatMediaTime(state.duration)}
              </span>
            </div>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => onVolumeChange(muted ? 0.8 : 0)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#A473FF]/5 hover:text-[#8B5CF6] dark:hover:text-[#A473FF]"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-14 cursor-pointer accent-[#7C3AED]"
          />
        </div>
      </div>
    </div>
  );
}
