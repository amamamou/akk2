"use client";

import React from "react";
import { X } from "lucide-react";

type AudioItem = { id: string; title: string; duration: number; type: string; url?: string };

export default function SongPickerModal({
  open,
  onClose,
  audio,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  audio: AudioItem[];
  onSelect: (item: AudioItem) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[min(720px,95%)] max-h-[80vh] overflow-auto bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Select a song</h3>
          <button onClick={onClose} className="text-gray-500 p-1 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {audio.length === 0 && <div className="text-sm text-gray-500">No audio available</div>}
          {audio.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div>
                <div className="font-medium text-sm">{a.title}</div>
                <div className="text-xs text-gray-400">{a.duration}m</div>
              </div>
              <div>
                <button
                  onClick={() => onSelect(a)}
                  className="px-3 py-1 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800"
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

