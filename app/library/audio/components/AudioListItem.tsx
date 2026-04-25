"use client";

import React from "react";
import { Eye, Edit, Trash } from "lucide-react";
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
  visibleCols: { duration: boolean; added: boolean; modified: boolean; addedBy: boolean };
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
        "group grid grid-cols-[48px_1fr_140px] gap-4 items-center p-3 rounded-md border border-gray-100 bg-white transition-all duration-150",
        // match triage buttons: subtle shadow, no heavy transform
        isSelected ? "shadow-sm" : "hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400"
      )}
    >
      <div className={cn("flex items-center justify-center rounded-md w-12 h-12", "transition-transform") }>
        <AudioVisual size={36} color={item.color ?? "#A473FF"} />
      </div>

      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
        <div className="mt-1 text-xs text-gray-500">{item.singer ?? "Unknown Artist"}</div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {visibleCols.duration && (
          <div className="text-right">
            <div className="text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{item.duration}</div>
          </div>
        )}
        {visibleCols.added && (
          <div className="text-right">
            <div className="text-gray-600 px-3 py-1 rounded-full text-xs">{item.addedAt ?? "-"}</div>
          </div>
        )}
        {visibleCols.modified && (
          <div className="text-right">
            <div className="text-gray-600 px-3 py-1 rounded-full text-xs">{item.modifiedAt ?? "-"}</div>
          </div>
        )}
        {visibleCols.addedBy && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
              {(item.addedBy ?? "U").toString().split(" ").map((s: string) => s.charAt(0)).slice(0,2).join("")}
            </div>
            <div className="text-sm text-gray-600">{item.addedBy ?? "Unknown"}</div>
          </div>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onView(item); }}
            title="View"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
            title="Edit"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Delete" className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
