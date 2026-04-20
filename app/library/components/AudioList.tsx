"use client";

import React, { useState } from "react";
import { MoreVertical, FileAudio, Play, Plus as PlusIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { AudioItem } from "./AudioTile";

function AudioListRow({
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
      onClick={() => setSelected((s) => !s)}
      className={cn(
        "group relative flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-md hover:border-gray-300 transition-all duration-200",
        selected ? "bg-[#F5F5F5]" : ""
      )}
    >
      {/* Icon + Title */}
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
        <FileAudio size={18} className={cn("text-gray-600 group-hover:text-gray-700", selected ? "text-gray-900" : "")} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 truncate" title={audio.title}>
          {audio.title}
        </div>
        {audio.spacesCount > 0 && (
          <div className="mt-0.5 text-xs text-gray-500">
            {audio.spacesCount} space{audio.spacesCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="text-sm text-gray-600 flex-shrink-0">{audio.duration}</div>

      {/* Actions - hidden until hover */}
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
          <PlusIcon size={16} />
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
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Play
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onAction?.("addToPlaylist", audio.id);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Add to Playlist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AudioList({
  items,
  onAudioAction,
}: {
  items: AudioItem[];
  onAudioAction?: (action: "play" | "addToPlaylist", audioId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((audio) => (
        <AudioListRow key={audio.id} audio={audio} onAction={onAudioAction} />
      ))}
    </div>
  );
}
