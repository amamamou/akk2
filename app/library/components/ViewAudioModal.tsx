"use client";

import React from "react";
import type { AudioItem } from "./AudioTile";
import { X, Clock, ListMusic, Play, Calendar } from "lucide-react";
import Image from "next/image";

export default function ViewAudioModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: AudioItem | null;
  onClose: () => void;
}) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
            <p className="text-sm text-gray-500">{item.singer ?? "Unknown Artist"}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="text-sm text-gray-700">{item.duration}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                <ListMusic size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Playlist</p>
                <p className="text-sm text-gray-700">{item.playlistId ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                  <Play size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Size</p>
                  <p className="text-sm text-gray-700">{typeof item.size === 'number' ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : '—'}</p>
                </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Added</p>
                <p className="text-sm text-gray-700">{item.addedAt ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Modified</p>
                <p className="text-sm text-gray-700">{item.modifiedAt ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400">Added by</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700 shrink-0 overflow-hidden border border-gray-200">
                  {((item as AudioItem & { addedByAvatar?: string }).addedByAvatar) ? (
                    <Image
                      src={(item as AudioItem & { addedByAvatar?: string }).addedByAvatar!}
                      alt={`${((item as AudioItem & { addedBy?: string }).addedBy) ?? "Unknown"} avatar`}
                      width={32}
                      height={32}
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>
                      {(((item as AudioItem & { addedBy?: string }).addedBy) ?? "U").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{((item as AudioItem & { addedBy?: string }).addedBy) ?? "Unknown"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
