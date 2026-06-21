"use client";

import React from "react";
import { CalendarDays, Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/utils/cn";

const ghostBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300";

export default function PlayerActions({
  isPlaying = false,
  onPlayPause,
  onSkip,
  onOpenSchedule,
}: {
  isPlaying?: boolean;
  onPlayPause?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onSkip?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenSchedule?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause?.(e);
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause" : "Play"}
        aria-pressed={isPlaying}
        className={cn(ghostBtnClass, isPlaying && "text-[#8B5CF6] dark:text-[#A473FF]")}
      >
        {isPlaying ? <Pause size={14} strokeWidth={2} /> : <Play size={14} strokeWidth={2} />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSkip?.(e);
        }}
        aria-label="Skip track"
        title="Skip track"
        className={ghostBtnClass}
      >
        <SkipForward size={14} strokeWidth={2} />
      </button>
      {onOpenSchedule ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSchedule(e);
          }}
          aria-label="Open schedule"
          title="View schedule"
          className={ghostBtnClass}
        >
          <CalendarDays size={14} strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
