"use client";
import React, { useMemo, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from "lucide-react";

interface NowPlayingProps {
  evt: { id: string; title: string; duration?: number } | null;
  playingProgress?: number; // seconds
  playlistLength?: number;
  onEmptyClick?: () => void;
  isPlaying?: boolean;
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export default function NowPlaying({ evt, playingProgress = 0, onEmptyClick, isPlaying: playingProp }: NowPlayingProps) {
  const [localPlaying, setLocalPlaying] = useState<boolean>(() => !!playingProp);

  const duration = evt?.duration && evt.duration > 0 ? evt.duration : 180;

  const percent = useMemo(() => {
    if (!evt) return 0;
    return Math.min(100, Math.max(0, (playingProgress / duration) * 100));
  }, [evt, playingProgress, duration]);

  if (!evt) {
    return (
      <div className="w-full h-14 flex items-center justify-center rounded-md bg-gray-50 text-sm text-gray-500" role="status">
        <button
          onClick={() => onEmptyClick?.()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50"
        >
          <Music size={16} />
          Create or select a track
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full rounded-lg bg-white border border-gray-100 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-50 border border-gray-100">
              <Music size={18} className="text-[#A473FF]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate" title={evt.title}>
                {evt.title}
              </div>
              <div className="text-xs text-gray-500">Now playing</div>
            </div>
          </div>

          <div className="flex-1 px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous"
                  className="p-2 rounded-md hover:bg-gray-50"
                >
                  <SkipBack size={18} />
                </button>
                <button
                  aria-label={localPlaying ? "Pause" : "Play"}
                  onClick={() => setLocalPlaying((s) => !s)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#A473FF] text-white shadow-sm hover:brightness-95"
                >
                  {localPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  aria-label="Next"
                  className="p-2 rounded-md hover:bg-gray-50"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-[#A473FF]"
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{formatTime(playingProgress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-gray-50">
              <Volume2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
