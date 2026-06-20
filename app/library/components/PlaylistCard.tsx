"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock3, Disc3, Edit2, MoreHorizontal, Music, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Playlist } from "./PlaylistModal";
import { isValidPlaylistId } from "@/lib/playlist-mapper";
import { dashboardAccentDot, dashboardIconChip } from "@/app/dashboard/dashboard-styles";

const coverGradients = {
  indigo: "from-indigo-500 via-indigo-600 to-indigo-900",
  blue: "from-blue-500 via-blue-600 to-blue-900",
  purple: "from-[#7C3AED] via-[#8B5CF6] to-[#202538]",
  slate: "from-slate-500 via-slate-600 to-slate-900",
  gray: "from-zinc-500 via-zinc-600 to-zinc-900",
  emerald: "from-emerald-500 via-emerald-600 to-emerald-900",
} as const;

type CoverGradientKey = keyof typeof coverGradients;

function resolveCoverGradient(color?: string | null): string {
  if (color && color in coverGradients) {
    return coverGradients[color as CoverGradientKey];
  }
  return coverGradients.indigo;
}

function formatRelativeDate(iso: string): string | null {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 1) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days}d ago`;
  return null;
}

export default function PlaylistCard({
  playlist,
  onEdit,
  onDelete,
  onClick,
  onPlay,
}: {
  playlist: Playlist;
  onEdit?: (playlistId: string, newTitle: string) => void;
  onDelete?: (playlistId: string) => void;
  onClick?: () => void;
  onPlay?: (playlistId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.title);
  const [coverError, setCoverError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 50);
    return () => clearTimeout(t);
  }, [isEditing]);

  useEffect(() => {
    setCoverError(false);
  }, [playlist.id, playlist.cover, playlist.coverColor]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  function saveName() {
    const trimmed = name.trim();
    if (trimmed === "") return;
    setIsEditing(false);
    if (trimmed !== playlist.title) {
      onEdit?.(playlist.id, trimmed);
    }
  }

  const gradientClass = resolveCoverGradient(playlist.coverColor);
  const remoteCover =
    typeof playlist.cover === "string" &&
    (playlist.cover.startsWith("http://") || playlist.cover.startsWith("https://"));
  const relativeUpdate = formatRelativeDate(playlist.lastModified);

  const openPlaylist = () => {
    if (!isValidPlaylistId(playlist.id)) return;
    onClick?.();
  };

  return (
    <article className="group relative w-full">
      <div
        onClick={() => {
          if (!isValidPlaylistId(playlist.id)) return;
          if (onPlay) onPlay(playlist.id);
          else openPlaylist();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") openPlaylist();
        }}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-200",
          "ring-1 ring-gray-100 group-hover:ring-[#A473FF]/25 group-hover:shadow-[0_12px_40px_rgba(164,115,255,0.12)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A473FF]/40",
          "dark:ring-zinc-700/60 dark:group-hover:ring-[#A473FF]/30",
          gradientClass
        )}
      >
        {remoteCover && !coverError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playlist.cover}
            alt={playlist.title}
            onError={() => setCoverError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/10">
            <div className={cn(dashboardIconChip, "h-12 w-12 rounded-xl bg-white/10 ring-white/20")}>
              <Music size={22} className="text-white/90" strokeWidth={1.8} />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 text-[10px] font-medium tabular-nums text-white/90 backdrop-blur-sm">
            <Disc3 size={10} strokeWidth={2} />
            {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
          </span>
          {playlist.totalDuration && playlist.totalDuration !== "0m" ? (
            <span className="rounded-md bg-black/30 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              {playlist.totalDuration}
            </span>
          ) : null}
        </div>

        <div ref={menuRef} className="absolute right-2.5 top-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-opacity",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              menuOpen && "opacity-100"
            )}
            aria-label="Playlist actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:border-zinc-700 dark:bg-zinc-900"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setName(playlist.title);
                  setIsEditing(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Edit2 size={14} />
                Rename
              </button>
              <div className="my-1 h-px bg-gray-100 dark:bg-zinc-800" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(playlist.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 min-w-0">
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
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-medium text-gray-900 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        ) : (
          <h3
            className="line-clamp-2 cursor-pointer text-sm font-semibold tracking-tight text-gray-950 transition-colors group-hover:text-[#7C3AED] dark:text-zinc-100 dark:group-hover:text-[#A473FF]"
            title={playlist.title}
            onClick={(e) => {
              e.stopPropagation();
              openPlaylist();
            }}
          >
            {playlist.title}
          </h3>
        )}

        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
          {relativeUpdate ? (
            <>
              <Clock3 size={10} strokeWidth={2} />
              <span>{relativeUpdate}</span>
            </>
          ) : (
            <>
              <span className={dashboardAccentDot} aria-hidden />
              <span className="truncate">{playlist.description || "Playback program"}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
