"use client";
import React, { useEffect, useRef, useState } from "react";
import { Speaker, Wifi, WifiOff, MoreHorizontal, Pencil, Trash, X } from "lucide-react";
import NowPlaying from "./NowPlaying";
import NextEvent from "./NextEvent";
import PlayerActions from "./PlayerActions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";

type Track = { id: string; title: string; duration?: number };
type Upcoming = { id: string; title: string; time?: string };

type Player = {
  id: string;
  roomId: string;
  roomName: string;
  playerName: string;
  status: "online" | "offline" | "idle";
  nowPlaying?: Track | null;
  nextEvent?: Upcoming | null;
  playingProgress?: number;
  isPlaying?: boolean;
  playlist?: Track[];
};

export default function PlayerRow({ player, onPlayPause, onSkip, onRename, onDelete, onRequestEdit, editing }: { player: Player; onPlayPause: (id: string) => void; onSkip: (id: string) => void; onRename: (id: string, name: string) => void; onDelete?: (id: string) => void; onRequestEdit?: (id: string) => void; editing?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<boolean>(!!editing);
  // edit the room name (user request) instead of the player name
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

  return (
    <div className="relative flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors duration-150">
      {/* LEFT: Location (Fixed Width) */}
      <div className="relative  flex min-w-[220px] items-center gap-3">
        {/* Icon */}
        <div className="relative shrink-0">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
            <Speaker size={16} className="text-gray-600" />
          </div>
          {(player.status === "online" || player.status === "idle") && (
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-white" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-sm">
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
              <span
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select?.(); }, 50); }}
                className="line-clamp-1 cursor-pointer px-2 py-0.5 text-sm font-medium text-gray-900 hover:text-gray-700"
                title={player.roomName}
              >
                {player.roomName}
              </span>
            )}
            <div className="mt-0.5 text-xs font-medium text-gray-500">
              {player.playerName}
            </div>
          </div>
        </div>
      </div>

      {/* NOW PLAYING (Flex) */}
      <div className="flex-1 relative z-10">
        <NowPlaying
          evt={player.nowPlaying ?? null}
          playingProgress={player.playingProgress ?? 0}
          playlistLength={player.playlist?.length ?? 0}
          onEmptyClick={() => router.push(`/schedule?roomId=${player.id}`)}
          isPlaying={!!player.isPlaying}
        />
      </div>

      {/* NEXT EVENT (Fixed Width) */}


      {/* STATUS BADGE (Fixed Width) */}
      <div className="relative  flex w-20 justify-end">
        {player.status === "online" ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
            aria-label="Online"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
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

      {/* CONTROLS (Compact) */}
      <div className="flex items-center gap-2 shrink-0 relative ">
        <PlayerActions
          isPlaying={!!player.isPlaying}
          onPlayPause={(e) => { e?.stopPropagation(); onPlayPause(player.id); }}
          onSkip={(e) => { e?.stopPropagation(); onSkip(player.id); }}
          onOpenSchedule={(e) => { e?.stopPropagation(); router.push(`/schedule?roomId=${player.id}`); }}
        />

        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setMenuOpen((s) => !s); }} 
            aria-label="Open menu" 
            title="More options"
            className="p-2.5 rounded-lg border border-gray-200/60 bg-white hover:bg-gray-100 text-gray-600 cursor-pointer transition-all duration-200 hover:shadow-sm"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm">
              <button 
                aria-label="Rename" 
                onClick={() => { setMenuOpen(false); onRequestEdit?.(player.id); }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Pencil size={16} className="text-gray-500" />
                <span>Rename</span>
              </button>
              <div className="h-px bg-gray-100" />
              <button 
                aria-label="Delete" 
                onClick={() => { setMenuOpen(false); setConfirmOpen(true); }} 
                className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
              >
                <Trash size={16} className="text-gray-500 group-hover:text-red-600" />
                <span>Delete</span>
              </button>
            </div>
          )}
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
