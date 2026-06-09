"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from '@/app/context/AuthContext';
import type { AuthUser } from '@/types/api';
import { createPortal } from "react-dom";
import PlayerActions from "./PlayerActions";
import { 
  MoreHorizontal, Pencil, Trash, Cast
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
  const { user } = useAuth();
  const [name, setName] = useState(player.roomName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
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
    <div
      role="button"
      tabIndex={0}
      aria-pressed={false}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      }}
      className={"group bg-[#FAFAFB] rounded-[24px] border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-[0_12px_32px_rgba(0,0,0,0.05)] transition-all duration-200 p-4 min-h-[72px]"}
      onClick={() => { /* keep card click available for parent if needed */ }}
    >
      {/* ICON with status overlay */}
      <div className="relative rounded-2xl bg-[#F3F0FF] p-3 w-16 h-16 flex items-center justify-center">
        <div className="rounded-xl bg-[#A473FF] p-2.5">
          <Cast size={18} className="text-white" />
        </div>

        <span className={`absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
      </div>

      {/* MAIN */}
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-zinc-900 truncate">
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
              className={`w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors md:mr-40 md:max-w-[46ch] max-w-[36ch] ${
                name.trim() === "" ? "border-dashed border-gray-300 bg-gray-50" : "border-gray-300 bg-white"
              }`}
            />
          ) : (
            <span
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select?.(); }, 50); }}
              className="line-clamp-1 cursor-pointer px-2 py-0.5 text-sm font-medium text-gray-900 hover:text-gray-700 truncate inline-block max-w-[36ch] md:max-w-[46ch]"
              title={player.roomName}
            >
              {player.roomName}
            </span>
          )}
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500 line-clamp-3">
            {player.playerName ? player.playerName : 'No description provided.'}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="md:col-auto col-span-2 flex items-center md:justify-end justify-start gap-3 w-full">
        <div className={`hidden md:flex items-center gap-2 transition-all transform z-30 opacity-0 group-hover:opacity-100`}> 
          <PlayerActions
            isPlaying={!!player.isPlaying}
            onPlayPause={(e) => { e?.stopPropagation(); onOpenSchedule?.(); }}
            onSkip={(e) => { e?.stopPropagation(); /* keep noop or wire if needed */ }}
            onOpenSchedule={(e) => { e?.stopPropagation(); onOpenSchedule?.(); }}
          />

          <div className="relative">
            <button
              ref={menuTriggerRef}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((s) => !s);
              }}
              title="More options"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Portal-anchored menu to avoid stacking context issues */}
            {menuOpen && typeof document !== "undefined" && (
              // compute/render into body
              <PortalMenu
                triggerRef={menuTriggerRef}
                menuRef={menuRef}
                user={user}
                onClose={() => setMenuOpen(false)}
                onRename={() => { setMenuOpen(false); onRequestEdit?.(player.id); }}
                onDelete={() => { setMenuOpen(false); setConfirmOpen(true); }}
              />
            )}
          </div>
        </div>

        {/* mobile kebab */}
        <div className="md:hidden ml-auto relative z-30">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((s) => !s); }}
            title="Actions"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Open actions"
          >
            <MoreHorizontal size={18} />
          </button>
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

function PortalMenu({
  triggerRef,
  menuRef,
  user,
  onClose,
  onRename,
  onDelete,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  user: AuthUser | null;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    let mounted = true;

    function compute() {
      const trigger = triggerRef.current;
      const menuEl = menuRef.current;
      if (!trigger || !menuEl) return;

      const rect = trigger.getBoundingClientRect();
      const menuRect = menuEl.getBoundingClientRect();
      const width = menuRect.width || 192;
      const height = menuRect.height || 120;

      // try to place below the trigger, align right edge to trigger
      let top = rect.bottom + 8;
      let left = rect.right - width;

      // clamp horizontally
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

      // if overflowing bottom, place above
      if (top + height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - height - 8);
      }

      if (mounted) setMenuStyle({ position: "fixed", top, left, zIndex: 9999 });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function onDown(e: PointerEvent) {
      const menuEl = menuRef.current;
      const trigger = triggerRef.current;
      const target = e.target as Node | null;
      if (!menuEl || !trigger) return;
      if (menuEl.contains(target) || trigger.contains(target)) return;
      onClose();
    }

    // compute after a frame so menuRef has layout
    requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);

    return () => {
      mounted = false;
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [onClose, triggerRef, menuRef]);

  const menu = (
    <div
      ref={menuRef}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm"
      style={menuStyle || { position: "fixed", top: -9999, left: -9999, zIndex: 9999 }}
    >
      <button
        aria-label="Rename"
        onClick={() => { onClose(); onRename(); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <Pencil size={16} className="text-gray-500" />
        <span>Rename</span>
      </button>
      <div className="h-px bg-gray-100" />
            {user?.role === 'SUPER_ADMIN' && (
              <button
                aria-label="Delete"
                onClick={() => { onClose(); onDelete(); }}
                className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Trash size={16} className="text-gray-500" />
                <span>Delete</span>
              </button>
            )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
}
