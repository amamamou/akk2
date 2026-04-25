"use client";
import React, { useEffect, useRef, useState } from "react";
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
      className={`group grid grid-cols-[64px_1fr] md:grid-cols-[64px_1fr_160px] gap-4 items-start p-4 rounded-md border border-gray-100 bg-white transition-all duration-150 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400 min-h-[72px]`}
      onClick={() => { /* keep card click available for parent if needed */ }}
    >
      {/* ICON with status overlay */}
      <div className={"relative flex items-center justify-center rounded-md w-16 h-16 transition-transform"}>
        <div className="relative rounded-md p-3 shadow-sm" style={{ backgroundColor: '#A473FF' }}>
          <Cast size={20} style={{ color: '#F3F4F6' }} />

          {/* status indicator */}
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="sr-only">{isActive ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">
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
        <div className={`hidden md:flex items-center gap-2 transition-all transform z-30 opacity-100`}> 
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
  onClose,
  onRename,
  onDelete,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
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
      <button
        aria-label="Delete"
        onClick={() => { onClose(); onDelete(); }}
        className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <Trash size={16} className="text-gray-500" />
        <span>Delete</span>
      </button>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
}
