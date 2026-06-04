"use client";

import React from "react";
import { Eye, Edit, Trash, MoreVertical } from "lucide-react";
import AudioVisual from "../../components/AudioVisual";
import type { AudioItem } from "../../components/AudioTile";
import { cn } from "@/utils/cn";

export default function AudioListItem({
  item,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  visibleCols,
}: {
  item: AudioItem;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onView: (item: AudioItem) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  visibleCols: { duration: boolean; added: boolean; modified: boolean; addedBy: boolean; size: boolean };
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(item.id === (isSelected ? null : item.id) ? null : item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item.id === (isSelected ? null : item.id) ? null : item.id);
        }
      }}
      className={cn(
        "group grid grid-cols-[56px_1fr] md:grid-cols-[56px_1fr_auto] gap-5 items-center px-5 py-4 rounded-2xl bg-[#FAFAFB] border border-transparent transition-all duration-200",
        // hover and selection states
        isSelected
          ? "bg-white border-[#A473FF]/20 shadow-[0_8px_30px_rgba(164,115,255,0.08)]"
          : "hover:bg-white hover:border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400"
      )}
    >
      <div className={cn("flex items-center justify-center rounded-2xl w-14 h-14 bg-white", "transition-transform")}>
        <AudioVisual size={44} color={item.color ?? "#A473FF"} src={item.url} />
      </div>

      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-zinc-900 truncate">{item.title}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          <span className="truncate">{item.singer ?? "Unknown Artist"}</span>
          {visibleCols.size && typeof item.size === 'number' && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="text-xs text-zinc-400">{(item.size / 1024 / 1024).toFixed(1)}MB</span>
            </>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-zinc-400">{(((item as Record<string, unknown>)['status']) as string | undefined) ?? "Ready for playback"}</span>
        </div>
      </div>

      <div className="md:col-auto col-span-2 flex items-center md:justify-end justify-start gap-3 w-full">
        {visibleCols.duration && (
          <div className="hidden md:block text-right">
            <div className="bg-[#F4F4F5] rounded-full px-3 py-1 text-xs font-medium text-zinc-600">{item.duration}</div>
          </div>
        )}
        {visibleCols.added && (
          <div className="hidden md:block text-right">
            <div className="text-zinc-600 px-3 py-1 rounded-full text-xs">{item.addedAt ?? "-"}</div>
          </div>
        )}
        {visibleCols.modified && (
          <div className="hidden md:block text-right">
            <div className="text-zinc-600 px-3 py-1 rounded-full text-xs">{item.modifiedAt ?? "-"}</div>
          </div>
        )}
        {visibleCols.addedBy && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#F3F0FF] text-[#A473FF] flex items-center justify-center text-xs font-semibold">
              {(item.addedBy ?? "U").toString().split(" ").map((s: string) => s.charAt(0)).slice(0,2).join("")}
            </div>
            <div className="hidden md:block text-sm text-zinc-600">{item.addedBy ?? "Unknown"}</div>
          </div>
        )}

  {/* management actions: visible on hover for md+; on mobile show kebab menu */}
  <div className="hidden md:flex items-center gap-2 opacity-0 md:group-hover:opacity-100 transition-all transform md:group-hover:translate-x-0 md:translate-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(item); }}
            title="View"
            className="p-1.5 rounded text-zinc-400 hover:bg-[#FAFAFB] hover:text-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-200"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            title="Edit"
            className="p-1.5 rounded text-zinc-400 hover:bg-[#FAFAFB] hover:text-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-200"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            title="Delete"
            className="p-1.5 rounded text-zinc-400 hover:bg-[#FAFAFB] hover:text-zinc-800 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-200"
          >
            <Trash size={16} />
          </button>
        </div>

        {/* mobile kebab */}
        <div className="md:hidden ml-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onView(item); }}
            title="Actions"
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Open actions"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
