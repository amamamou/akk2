"use client";

import React from "react";
import AudioTile, { AudioItem } from "./AudioTile";

export default function AudioGrid({
  items,
  onAudioAction,
}: {
  items: AudioItem[];
  onAudioAction?: (action: "play" | "addToPlaylist", audioId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((audio) => (
        <AudioTile key={audio.id} audio={audio} onAction={onAudioAction} />
      ))}
    </div>
  );
}
