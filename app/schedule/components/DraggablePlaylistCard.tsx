"use client";
import React from "react";
import { useDrag } from "react-dnd";
import { GripHorizontal, Music } from "lucide-react";
import { cn } from "../../../utils/cn";
import type { Playlist } from "../../library/components/PlaylistModal";

const ITEM_TYPES = { PLAYLIST: "playlist" };

export default function DraggablePlaylistCard({ playlist }: { playlist: Playlist }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPES.PLAYLIST,
    item: { playlistId: playlist.id, title: playlist.title, trackCount: playlist.trackCount, totalDuration: playlist.totalDuration },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div
      ref={(el) => (dragRef as unknown as (instance: HTMLDivElement | null) => void)(el)}
      className={cn(
        "flex items-center gap-3 flex-shrink-0 rounded-md bg-white border border-transparent hover:bg-gray-50 hover:border-gray-100 px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition transform duration-150 min-w-[220px]",
        isDragging ? "opacity-60 scale-95 shadow-lg" : ""
      )}
    >
      <div className="text-gray-400">
        <GripHorizontal size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* ICON with status overlay */}
            <div className={"relative flex items-center justify-center rounded-md w-12 h-12 transition-transform"}>
              <div className="relative rounded-md p-2" style={{ backgroundColor: '#A473FF' }}>
                <Music size={16} style={{ color: '#F3F4F6' }} />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{playlist.title}</div>
              <div className="text-xs text-gray-500 truncate">{playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{playlist.totalDuration}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
