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
}: {
  items: AudioItem[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onView: (item: AudioItem) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  visibleCols: { duration: boolean; added: boolean; modified: boolean; addedBy: boolean; size: boolean };
}) {
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
