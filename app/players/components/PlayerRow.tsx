"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Radio, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/utils/cn";
import { STATUS_CONFIG } from "../lib/player-status";
import type { PlayerViewModel } from "../types";
import PlayerActions from "./PlayerActions";

const rowActionClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100";

export default function PlayerRow({
  player,
  onPlayPause,
  onSkip,
  onRename,
  onRequestDelete,
  onRequestEdit,
  editing,
  deleting = false,
}: {
  player: PlayerViewModel;
  showClient?: boolean;
  onPlayPause: (id: string) => void;
  onSkip: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRequestDelete?: () => void;
  onRequestEdit?: (id: string) => void;
  editing?: boolean;
  deleting?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const status = STATUS_CONFIG[player.status];
  const [isEditing, setIsEditing] = useState(!!editing);
  const [name, setName] = useState(player.roomName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const locationLabel = player.locationName || player.roomName || player.playerName;
  const playbackLabel = player.nowPlaying?.title ?? "Nothing playing";
  const playlistLabel =
    player.playlist.length > 0
      ? `${player.playlist.length} track${player.playlist.length === 1 ? "" : "s"}`
      : "No playlist";

  useEffect(() => {
    if (!editing) return;
    const t = window.setTimeout(() => {
      setIsEditing(true);
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 50);
    return () => window.clearTimeout(t);
  }, [editing]);

  function save() {
    if (name.trim() === "") return;
    onRename(player.id, name.trim());
    setIsEditing(false);
  }

  const metaParts = [status.label, locationLabel].filter(Boolean);

  return (
    <article
      className={cn(
        "group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3",
        "border-b border-gray-100 last:border-b-0 dark:border-zinc-800/80 sm:grid-cols-[36px_1fr_minmax(0,9rem)_minmax(0,7rem)_auto] sm:gap-4 sm:px-5",
        "transition-colors hover:bg-[#A473FF]/[0.04] dark:hover:bg-[#A473FF]/[0.06]"
      )}
    >
      <div
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500"
        aria-hidden
      >
        <Radio size={14} strokeWidth={2} />
      </div>

      <div className="min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={name}
            placeholder="Player name"
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setName(player.roomName);
                setIsEditing(false);
              }
            }}
            className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-900 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        ) : (
          <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
            {player.roomName}
          </p>
        )}
        <p className="mt-0.5 truncate text-xs text-gray-400">{metaParts.join(" · ")}</p>
      </div>

      <p className="hidden truncate text-xs text-gray-400 sm:block">{playbackLabel}</p>

      <p className="hidden truncate text-xs text-gray-400 sm:block">{playlistLabel}</p>

      <div className="flex items-center justify-end gap-0.5">
        <PlayerActions
          isPlaying={!!player.isPlaying}
          onPlayPause={() => onPlayPause(player.id)}
          onSkip={() => onSkip(player.id)}
          onOpenSchedule={() => router.push(`/schedule?roomId=${encodeURIComponent(player.id)}`)}
        />

        <button
          type="button"
          onClick={() => onRequestEdit?.(player.id)}
          aria-label={`Rename ${player.roomName}`}
          className={cn(
            rowActionClass,
            "hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          )}
        >
          <Pencil size={14} />
        </button>

        {isSuperAdmin && onRequestDelete ? (
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={deleting}
            aria-label={`Delete ${player.roomName}`}
            className={cn(
              rowActionClass,
              "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30",
              deleting && "cursor-wait opacity-50"
            )}
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        ) : null}
      </div>
    </article>
  );
}
