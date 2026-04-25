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
          "group grid grid-cols-[48px_1fr] md:grid-cols-[48px_1fr_140px] gap-4 items-center p-3 rounded-md border border-gray-100 bg-white transition-all duration-150",
          // match triage buttons: subtle shadow, no heavy transform
          isSelected ? "shadow-sm" : "hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400"
        )}
    >
      <div className={cn("flex items-center justify-center rounded-md w-12 h-12", "transition-transform") }>
        <AudioVisual size={36} color={item.color ?? "#A473FF"} src={item.url} />
      </div>

      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
          <span>{item.singer ?? "Unknown Artist"}</span>
          {visibleCols.size && typeof item.size === 'number' && (
            <span className="text-xs text-gray-400">• {(item.size / 1024 / 1024).toFixed(1)}MB</span>
          )}
        </div>
      </div>

      <div className="md:col-auto col-span-2 flex items-center md:justify-end justify-start gap-3 w-full">
        {visibleCols.duration && (
          <div className="hidden md:block text-right">
            <div className="text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{item.duration}</div>
          </div>
        )}
        {visibleCols.added && (
          <div className="hidden md:block text-right">
            <div className="text-gray-600 px-3 py-1 rounded-full text-xs">{item.addedAt ?? "-"}</div>
          </div>
        )}
        {visibleCols.modified && (
          <div className="hidden md:block text-right">
            <div className="text-gray-600 px-3 py-1 rounded-full text-xs">{item.modifiedAt ?? "-"}</div>
          </div>
        )}
        {visibleCols.addedBy && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
              {(item.addedBy ?? "U").toString().split(" ").map((s: string) => s.charAt(0)).slice(0,2).join("")}
            </div>
            <div className="hidden md:block text-sm text-gray-600">{item.addedBy ?? "Unknown"}</div>
          </div>
        )}

  {/* management actions: visible on hover for md+; on mobile show kebab menu */}
  <div className="hidden md:flex items-center gap-2 opacity-0 md:group-hover:opacity-100 transition-all transform md:group-hover:translate-x-0 md:translate-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(item); }}
            title="View"
            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-200"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            title="Edit"
            className="p-1.5 rounded hover:bg-amber-50 text-amber-600 hover:text-amber-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-200"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            title="Delete"
            className="p-1.5 rounded text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-200"
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
