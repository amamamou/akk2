"use client";
import React from "react";

interface NowPlayingProps {
  evt: { id: string; title: string; duration?: number } | null;
  playingProgress?: number;
  playlistLength?: number;
  onEmptyClick?: () => void;
  isPlaying?: boolean;
}

export default function NowPlaying({ evt }: NowPlayingProps) {
  if (!evt) return <div className="w-full h-10" aria-hidden="true" />;

  return (
    <div className="w-full">
      <div className="w-full rounded-md bg-gray-50 p-3">
        <div className="min-w-0">
          <p className="line-clamp-2 truncate text-sm font-medium leading-snug text-gray-900" title={evt.title}>
            {evt.title}
          </p>
        </div>
      </div>
    </div>
  );
}
