"use client";
import React from "react";
import { Play, Pause, SkipForward, CalendarDays } from "lucide-react";

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
}) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause?.(e);
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause" : "Play"}
        aria-pressed={isPlaying}
        className="rounded-md border border-gray-200 bg-white p-2 text-gray-700 transition-colors duration-150 hover:bg-gray-100"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSkip?.(e);
        }}
        aria-label="Skip"
        title="Skip"
        className="rounded-md border border-gray-200 bg-white p-2 text-gray-700 transition-colors duration-150 hover:bg-gray-100"
      >
        <SkipForward size={14} />
      </button>
      {onOpenSchedule && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSchedule?.(e);
          }}
          aria-label="Open schedule"
          title="View schedule"
          className="rounded-md border border-gray-200 bg-white p-2 text-gray-700 transition-colors duration-150 hover:bg-gray-100"
        >
          <CalendarDays size={14} />
        </button>
      )}
    </div>
  );
}
