"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from '@/app/context/AuthContext';
import { createPortal } from "react-dom";
import { Cast, MoreHorizontal, Pencil, Trash } from "lucide-react";
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
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRefDesktop = useRef<HTMLDivElement | null>(null);
  const menuRefMobile = useRef<HTMLDivElement | null>(null);
  const menuTriggerDesktopRef = useRef<HTMLButtonElement | null>(null);
  const menuTriggerMobileRef = useRef<HTMLButtonElement | null>(null);
  const [menuTarget, setMenuTarget] = useState<"desktop" | "mobile" | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

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

  // close menu on outside pointer interactions or Escape
  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      if (!menuOpen) return;

      // Walk up from the event target to check if it's inside one of our elements.
  let node: Node | null = e.target as Node | null;
      while (node) {
        if (menuRefDesktop.current && node === menuRefDesktop.current) return;
        if (menuTriggerDesktopRef.current && node === menuTriggerDesktopRef.current) return;
        if (menuRefMobile.current && node === menuRefMobile.current) return;
        if (menuTriggerMobileRef.current && node === menuTriggerMobileRef.current) return;
        node = node.parentNode;
      }

      setMenuOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    // use pointerdown in capture so we can inspect the composed path before React synthetic events
    document.addEventListener("pointerdown", onDocPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // compute and update portal menu position
  useEffect(() => {
  if (!menuOpen || !menuTarget) return;
  const trigger = menuTarget === "desktop" ? menuTriggerDesktopRef.current : menuTriggerMobileRef.current;
  if (!trigger) return;

    const menuWidth = 192; // w-48 -> 12rem -> 192px
    function updatePos() {
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const left = Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8) + window.scrollX;
      const top = rect.bottom + 8 + window.scrollY;
      setMenuPos({ top, left });
    }

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos);
    };
  }, [menuOpen, menuTarget]);

  function save() {
    if (name.trim() === "") return;
    onRename(player.id, name.trim());
    setIsEditing(false);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={false}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      }}
      className={`group grid grid-cols-[48px_1fr] md:grid-cols-[48px_1fr_140px] gap-4 items-center p-3 rounded-md border border-gray-100 bg-white transition-all duration-150 ${isEditing ? "shadow-sm" : "hover:shadow-sm"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400`}
      onClick={() => { /* keep row click available for parent if needed */ }}
    >
      {/* ICON with status overlay */}
      <div className={"relative flex items-center justify-center rounded-md w-12 h-12 transition-transform"}>
        <div className="relative rounded-md p-2" style={{ backgroundColor: '#A473FF' }}>
          <Cast size={16} style={{ color: '#F3F4F6' }} />

          {/* status indicator: small ringed dot at bottom-right of icon */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${player.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}
            aria-hidden
          />
          <span className="sr-only">{player.status === 'online' ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
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
              className={`w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors md:mr-36 md:max-w-[40ch] max-w-[28ch] ${
                name.trim() === "" ? "border-dashed border-gray-300 bg-gray-50" : "border-gray-300 bg-white"
              }`}
            />
          ) : (
            <span
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select?.(); }, 50); }}
              className="line-clamp-1 cursor-pointer px-2 py-0.5 text-sm font-medium text-gray-900 hover:text-gray-700 truncate inline-block max-w-[28ch] md:max-w-[40ch]"
              title={player.roomName}
            >
              {player.roomName}
            </span>
          )}
        </div>
        {/* removed playerName and tracks count for minimal header */}
      </div>

      {/* STATUS + NOW PLAYING */}
      <div className="md:col-auto col-span-2 flex items-center md:justify-end justify-start gap-3 w-full">
  <div className={`hidden md:flex items-center gap-2 transition-all transform z-30 ${menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 md:group-hover:opacity-100 md:group-hover:translate-x-0 md:translate-x-2'}`}>
          <PlayerActions
            isPlaying={!!player.isPlaying}
            onPlayPause={(e) => { e?.stopPropagation(); onPlayPause(player.id); }}
            onSkip={(e) => { e?.stopPropagation(); onSkip(player.id); }}
            onOpenSchedule={(e) => { e?.stopPropagation(); router.push(`/schedule?roomId=${player.id}`); }}
          />


          <div className="relative">
            <button
              ref={menuTriggerDesktopRef}
              onClick={(e) => { e.stopPropagation(); setMenuTarget('desktop'); setMenuOpen((s) => !s); }}
              title="More options"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && menuTarget === 'desktop' && menuPos && createPortal(
              <div ref={menuRefDesktop} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, width: 192 }} className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm">
                <button
                  aria-label="Rename"
                  onClick={() => { setMenuOpen(false); setMenuTarget(null); onRequestEdit?.(player.id); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Pencil size={16} className="text-gray-500" />
                  <span>Rename</span>
                </button>
                <div className="h-px bg-gray-100" />
                {user?.role === 'SUPER_ADMIN' && (
                  <button
                    aria-label="Delete"
                    onClick={() => { setMenuOpen(false); setMenuTarget(null); setConfirmOpen(true); }}
                    className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Trash size={16} className="text-gray-500" />
                    <span>Delete</span>
                  </button>
                )}
              </div>,
              document.body
            )}
          </div>
          {/* delete moved to kebab menu */}
        </div>

  {/* mobile kebab */}
  <div className="md:hidden ml-auto relative z-30">
          <button
            ref={menuTriggerMobileRef}
            onClick={(e) => { e.stopPropagation(); setMenuTarget('mobile'); setMenuOpen((s) => !s); }}
            title="Actions"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Open actions"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && menuTarget === 'mobile' && menuPos && createPortal(
            <div ref={menuRefMobile} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, width: 192 }} className="bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm">
              <button
                aria-label="Rename"
                onClick={() => { setMenuOpen(false); setMenuTarget(null); onRequestEdit?.(player.id); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Pencil size={16} className="text-gray-500" />
                <span>Rename</span>
              </button>
              <div className="h-px bg-gray-100" />
              <button
                aria-label="Delete"
                onClick={() => { setMenuOpen(false); setMenuTarget(null); setConfirmOpen(true); }}
                className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Trash size={16} className="text-gray-500" />
                <span>Delete</span>
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* menu */}
      {/* menu is now rendered adjacent to the buttons above */}

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
