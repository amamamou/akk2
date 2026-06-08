"use client";

import React from "react";
import type { AudioItem } from "../../components/AudioTile";
import AudioListItem from "./AudioListItem";
import AudioEmpty from "./AudioEmpty";

export default function AudioList({
  items,
  selectedId,
  setSelectedId,
  onView,
  onEdit,
  onDelete,
  visibleCols,
  loading,
}: {
  items: AudioItem[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onView: (item: AudioItem) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  visibleCols: { duration: boolean; added: boolean; modified: boolean; addedBy: boolean; size: boolean };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-[#FAFAFB]">
            <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" aria-hidden />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" aria-hidden />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" aria-hidden />
            </div>
            <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" aria-hidden />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) return (
    <div className="h-full min-h-[260px] flex items-center justify-center">
      <AudioEmpty />
    </div>
  );

  return (
    <div className="space-y-2">
      {items.map((t) => (
        <AudioListItem
          key={t.id}
          item={t}
          isSelected={selectedId === t.id}
          onSelect={setSelectedId}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          visibleCols={visibleCols}
        />
      ))}
    </div>
  );
}
