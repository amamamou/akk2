"use client";

import React, { useState } from "react";
import { FileAudio, MoreVertical, Play, Plus } from "lucide-react";
import { cn } from "@/utils/cn";

export type AudioItem = {
  id: string;
  title: string;
  duration: string;
  durationMinutes: number;
  category: string;
  usageCount: number;
  spacesCount: number;
  lastPlayed?: string;
  isScheduled: boolean;
  singer?: string;
  // optional metadata
  playlistId?: string;
  addedAt?: string;
  modifiedAt?: string;
  addedBy?: string;
    url?: string;
  color?: string;
  size?: number;
  // optional metadata
};

export default function AudioTile({
  audio,
  onAction,
}: {
  audio: AudioItem;
  onAction?: (action: "play" | "addToPlaylist", audioId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelected((s) => !s)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelected((s) => !s);
        }
      }}
      className={cn(
        "group relative rounded-lg border border-gray-200 bg-white transition-all duration-200 cursor-pointer overflow-hidden p-4",
        "transform hover:shadow-lg hover:-translate-y-0.5",
        selected ? "bg-gray-50" : "hover:bg-gray-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon and content */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 flex-shrink-0",
              selected ? "bg-gray-200" : "bg-gray-100 group-hover:bg-gray-200"
            )}
          >
            <FileAudio
              size={20}
              className={cn("text-gray-600 group-hover:text-gray-800")}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={audio.title}>
              {audio.title}
            </h3>
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
              <span>{audio.duration}</span>
              {audio.spacesCount > 0 && (
                <>
                  <span>•</span>
                  <span>{audio.spacesCount} space{audio.spacesCount !== 1 ? "s" : ""}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("play", audio.id);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#F5F5F5] rounded transition-all"
            title="Play"
          >
            <Play size={16} className="fill-current" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.("addToPlaylist", audio.id);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#F5F5F5] rounded transition-all"
            title="Add to playlist"
          >
            <Plus size={16} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#F5F5F5] rounded transition-all"
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-50 w-40 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAction?.("play", audio.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5] transition-colors"
                >
                  Play
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAction?.("addToPlaylist", audio.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5] transition-colors"
                >
                  Add to Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
