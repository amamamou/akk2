"use client";
import React, { useEffect, useRef, useState } from "react";
import NowPlaying from "./NowPlaying";
import { 
  CalendarDays, MoreHorizontal, Pencil, Trash, Speaker, 
  Wifi, WifiOff, Radio, ChevronRight 
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Player = {
  id: string;
  roomId: string;
  roomName: string;
  playerName: string;
  status: "online" | "offline" | "idle";
  nowPlaying?: { id: string; title: string; duration?: number } | null;
  nextEvent?: { id: string; title: string; time?: string } | null;
  playingProgress?: number;
  isPlaying?: boolean;
  playlist?: { id: string; title: string; duration?: number }[];
};

function getLastActiveLabel(player: Player) {
  if (player.status === "online") return "Just now";
  if (player.status === "idle") return "10 min ago";
  return "2 hours ago";
}

export default function PlayerCard({
  player,
  onRename,
  editing,
  onOpenSchedule,
  onDelete,
  onRequestEdit,
}: {
  player: Player;
  onRename: (id: string, name: string) => void;
  editing?: boolean;
  onOpenSchedule?: () => void;
  onDelete?: (id: string) => void;
  onRequestEdit?: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState<boolean>(!!editing);
  const [name, setName] = useState(player.roomName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => {
        setIsEditing(true);
        inputRef.current?.focus();
        inputRef.current?.select?.();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [editing]);

  function save() {
    if (name.trim() === "") return;
    onRename(player.id, name.trim());
    setIsEditing(false);
  }

  const isActive = player.status === "online" || player.status === "idle";

  return (
    <div className=" relative overflow-hidden rounded-md border border-gray-200 bg-white transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50">
      <div className="relative z-10 flex flex-col gap-4 p-4">
        {/* Header: Icon, Title, Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Icon */}
            <div className="relative shrink-0">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-2.5">
                <Speaker size={18} className="text-gray-600" />
              </div>
              {isActive && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white" />
              )}
            </div>

            {/* Room and Player Info */}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={name}
                  placeholder="Enter location name"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={save}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") {
                      setName(player.roomName);
                      setIsEditing(false);
                    }
                  }}
                  className={`w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors ${
                    name.trim() === ""
                      ? "border-dashed border-gray-300 bg-gray-50"
                      : "border-gray-300 bg-white"
                  }`}
                />
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select?.();
                    }, 50);
                  }}
                  className="truncate cursor-pointer px-2 py-0.5 text-sm font-medium text-gray-900 hover:text-gray-700"
                  title={player.roomName}
                >
                  {player.roomName}
                </div>
              )}
              <div
                className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-500"
                title={player.playerName}
              >
                <Radio size={12} className="shrink-0 opacity-70" />
                <span className="truncate">{player.playerName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSchedule?.();
              }}
              aria-label="Open schedule"
              title="View schedule"
              className="rounded-md border border-gray-200 bg-white p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-100 cursor-pointer"
            >
              <CalendarDays size={16} />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((s) => !s);
                }}
                aria-label="Menu"
                title="More options"
                className="rounded-md border border-gray-200 bg-white p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-100 cursor-pointer"
              >
                <MoreHorizontal size={16} />
              </button>

              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRequestEdit?.(player.id);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                  >
                    <Pencil size={16} className="text-gray-500" />
                    <span>Rename</span>
                  </button>
                  <div className="h-px bg-gray-100" />
               <button
  onClick={() => {
    setMenuOpen(false);
    setConfirmOpen(true);
  }}
  className="group flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 cursor-pointer"
>
  <Trash
    size={16}
    className="text-gray-500 transition-colors group-hover:text-red-600"
  />
  <span>Delete</span>
</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Now Playing Section */}
        <div className="space-y-3">
          <NowPlaying
            evt={player.nowPlaying ?? null}
            playingProgress={player.playingProgress ?? 0}
            playlistLength={player.playlist?.length ?? 0}
            onEmptyClick={() => onOpenSchedule?.()}
            isPlaying={!!player.isPlaying}
          />
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            {player.status === "online" ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                aria-label="Online"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                <span>Online</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600"
                aria-label="Offline"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                <span>Offline</span>
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-gray-400">
            {getLastActiveLabel(player)}
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete player"
        description={`This will remove “${player.roomName}” from your players. You can re-add it later, but its current playback state will be lost.`}
        confirmLabel="Delete player"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete?.(player.id);
        }}
      />
    </div>
  );
}
