"use client";

import React from "react";
import { X, Play, Music } from "lucide-react";
import AudioVisual from "./AudioVisual";
import { cn } from "@/utils/cn";
import type { Playlist } from "./PlaylistModal";

export default function PlaylistDetailPanel({
  open,
  playlist,
  onClose,
}: {
  open: boolean;
  playlist: Playlist | null;
  onClose: () => void;
}) {
  if (!open || !playlist) return null;

  // mock tracks for demo — in a real app these would come from playlist data
  const tracks = Array.from({ length: Math.max(3, playlist.trackCount) }, (_, i) => ({
    id: `${playlist.id}-t${i + 1}`,
    title: `${playlist.title} — Track ${i + 1}`,
    duration: 180 + i * 10,
  }));

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="relative ml-auto w-full max-w-8xl h-full bg-white shadow-2xl overflow-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-20 h-20 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br", playlist.coverColor ? ("from-" + playlist.coverColor + "-500 to-" + playlist.coverColor + "-700") : "from-indigo-500 to-indigo-700") }>
              {playlist.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover" />
              ) : (
                <Music size={28} className="text-white/90" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{playlist.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{playlist.description || `${playlist.trackCount} ${playlist.trackCount === 1 ? 'track' : 'tracks'}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => console.log('[v0] Play playlist', playlist.id)} className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-md">
              <Play size={16} />
              Play
            </button>
            <button onClick={onClose} className="p-2 rounded-md text-gray-600 hover:bg-gray-50">
              <X />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tracks</h3>
          <div className="flex flex-col divide-y divide-gray-100">
            {tracks.map((t, idx) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* lightweight audio visual */}
                  <div className="flex-shrink-0">
                    <AudioVisual size={32} color={playlist.coverColor} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{idx + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
