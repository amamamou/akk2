"use client";

import React, { useState, useRef, useEffect } from "react";
import { Music, MoreVertical, Edit2, Trash } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Playlist } from "./PlaylistModal";
import { isValidPlaylistId } from "@/lib/playlist-mapper";

// Cover gradient presets (richer palette)
const coverGradients = {
  indigo: "from-indigo-500 via-indigo-600 to-indigo-800",
  blue: "from-blue-500 via-blue-600 to-blue-800",
  purple: "from-purple-500 via-purple-600 to-purple-800",
  slate: "from-slate-500 via-slate-600 to-slate-800",
  gray: "from-zinc-500 via-zinc-600 to-zinc-800",
  emerald: "from-emerald-500 via-emerald-600 to-emerald-800",
};

export default function PlaylistCard({
  playlist,
  onEdit,
  onDelete,
  onClick,
  onPlay,
}: {
  playlist: Playlist;
  // onEdit called when renaming: (id, newTitle)
  onEdit?: (playlistId: string, newTitle: string) => void;
  onDelete?: (playlistId: string) => void;
  onClick?: () => void;
  onPlay?: (playlistId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 50);
    return () => clearTimeout(t);
  }, [isEditing]);
  function saveName() {
    const trimmed = name.trim();
    if (trimmed === "") return;
    setIsEditing(false);
    if (trimmed !== playlist.title) {
      onEdit?.(playlist.id, trimmed);
    }
  }
  const gradientClass = coverGradients[playlist.coverColor || "indigo"];

  const openPlaylist = () => {
    if (!isValidPlaylistId(playlist.id)) return;
    onClick?.();
  };

  return (
    <div
      className="group relative cursor-pointer w-full flex flex-col items-start transform transition-transform duration-200 will-change-transform group-hover:scale-[1.03]"
    >
      {/* Cover (square, large, rounded) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!isValidPlaylistId(playlist.id)) return;
          if (onPlay) onPlay(playlist.id);
          else openPlaylist();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            openPlaylist();
          }
        }}
        className={cn("w-full aspect-square rounded-lg overflow-hidden relative bg-gradient-to-br", gradientClass)}
      >
        {playlist.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <Music size={36} className="text-white/70" />
          </div>
        )}
        {/* subtle persistent overlay to give depth */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* hover actions removed: simplified card — interactions available via top-right menu or clicking the card */}

        {/* Minimal 3-dot menu (top-right) */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 bg-white/80 text-gray-600 hover:text-gray-700 rounded-md shadow-sm opacity-90"
              aria-label="Playlist actions"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 z-50 w-36 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setName(playlist.title);
                    setIsEditing(true);
                  }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5] flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <div className="h-px bg-gray-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(playlist.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

  {/* Title and subtle metadata */}
  <div className="mt-2 w-full">
        {isEditing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveName()}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(playlist.title);
                setIsEditing(false);
              }
            }}
            className={`w-full text-sm font-medium text-gray-900 rounded-md border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300`}
          />
        ) : (
          <h3
            className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer"
            title={playlist.title}
            onClick={(e) => {
              e.stopPropagation();
              setName(playlist.title);
              setIsEditing(true);
            }}
          >
            {playlist.title}
          </h3>
        )}
        <div className="mt-1 text-xs text-gray-400">
          {playlist.trackCount > 0 ? (
            <span>{playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}</span>
          ) : (
            <span>{playlist.totalDuration}</span>
          )}
        </div>
      </div>
    </div>
  );
}
