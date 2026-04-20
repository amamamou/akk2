"use client";
import React from "react";
import { Play, Music, Disc3, Volume2 } from "lucide-react";
import Waveform from "./Waveform";

interface NowPlayingProps {
  evt: { id: string; title: string; duration?: number } | null;
  playingProgress: number;
  playlistLength: number;
  onEmptyClick: () => void;
  isPlaying: boolean;
}

export default function NowPlaying({
  evt,
  playingProgress,
  playlistLength,
  onEmptyClick,
  isPlaying,
}: NowPlayingProps) {
  const progressPercent = evt && evt.duration ? (playingProgress / evt.duration) * 100 : 0;
  const remainingTime = evt && evt.duration ? evt.duration - playingProgress : 0;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);

  if (!evt) {
    return (
      <button
        onClick={onEmptyClick}
        className="group flex w-full items-center gap-3 rounded-md border border-dashed border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      >
        <Music size={14} className="shrink-0 opacity-60" />
        <span>Add content to queue</span>
      </button>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Now Playing Section */}
      <div className="w-full rounded-md  border-gray-100 bg-gray-50 p-3">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Playing indicator */}
            <div className="mt-0.5 shrink-0">
              {isPlaying ? (
                <Disc3
                  size={14}
                  className="text-gray-700 animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              ) : (
                <Play size={14} className="text-gray-700" fill="currentColor" />
              )}
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1">
              <p
                className="line-clamp-2 truncate text-sm font-medium leading-snug text-gray-900"
                title={evt.title}
              >
                {evt.title}
              </p>
            </div>
          </div>

          {/* Time - right-aligned */}
          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium tabular-nums text-gray-500">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
        </div>

        {/* Waveform */}
        <div className="mt-1.5">
          <Waveform progress={progressPercent} isPlaying={isPlaying} />
        </div>
      </div>
    </div>
  );
}
