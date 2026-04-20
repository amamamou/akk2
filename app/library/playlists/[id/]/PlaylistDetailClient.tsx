"use client";

import React, { useState } from "react";
import { ArrowLeft, Play, Edit2, Trash2, GripVertical, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

// Sample tracks for a playlist
const sampleTracks = [
  { id: "t1", title: "Flow Begin", duration: "3:45" },
  { id: "t2", title: "Rising Sun", duration: "4:20" },
  { id: "t3", title: "Zenith", duration: "5:00" },
];

const coverGradients = {
  indigo: "from-indigo-400 to-indigo-600",
  blue: "from-blue-400 to-blue-600",
  purple: "from-purple-400 to-purple-600",
  slate: "from-slate-400 to-slate-600",
  gray: "from-gray-400 to-gray-600",
};

export default function PlaylistDetailClient({ playlistId }: { playlistId: string }) {
  const [tracks, setTracks] = useState(sampleTracks);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Mock playlist data
  const playlist = {
    id: playlistId,
    title: "Morning Yoga",
    description: "Energizing flows to start your day",
    trackCount: 3,
    totalDuration: "180m",
    usedInSchedule: true,
    spacesCount: 2,
    lastModified: "2 days ago",
    coverColor: "indigo" as const,
  };

  const gradientClass = coverGradients[playlist.coverColor];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <Link
            href="/library/playlists"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Playlists
          </Link>
        </div>
      </div>

      {/* Cover section */}
      <div className={cn("h-48 bg-gradient-to-br", gradientClass, "flex items-end p-8")}>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-white/80 text-sm">{playlist.description}</p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6 space-y-8">
          {/* Playlist info and actions */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tracks</p>
                  <p className="text-2xl font-bold text-gray-900">{playlist.trackCount}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{playlist.totalDuration}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Spaces</p>
                  <p className="text-2xl font-bold text-gray-900">{playlist.spacesCount}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Play size={16} className="fill-current" />
                Play
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Tracks section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tracks</h2>
              <button className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <Plus size={16} />
                Add track
              </button>
            </div>

            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={() => setDraggedId(track.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={cn(
                    "group flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all",
                    draggedId === track.id && "opacity-50 bg-gray-50"
                  )}
                >
                  <GripVertical
                    size={18}
                    className="text-gray-400 group-hover:text-gray-600 cursor-grab active:cursor-grabbing"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{track.title}</p>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">{track.duration}</span>
                  <button className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
