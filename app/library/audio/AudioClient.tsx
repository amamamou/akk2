"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus, FileAudio } from "lucide-react";
import { cn } from "../../../utils/cn";
import AudioGrid from "../components/AudioGrid";
import AudioList from "../components/AudioList";
import UploadModal from "../components/UploadModal";
import type { AudioItem } from "../components/AudioTile";

const library: AudioItem[] = [
  { id: "a1", title: "Morning Flow", duration: "60m", durationMinutes: 60, category: "Yoga", usageCount: 24, spacesCount: 3, lastPlayed: "today", isScheduled: true },
  { id: "a2", title: "Deep Focus", duration: "120m", durationMinutes: 120, category: "Meditation", usageCount: 18, spacesCount: 2, lastPlayed: "2 days ago", isScheduled: true },
  { id: "a3", title: "Lobby Ambience Loop", duration: "180m", durationMinutes: 180, category: "Lobby", usageCount: 5, spacesCount: 1, lastPlayed: undefined, isScheduled: false },
  { id: "a4", title: "Upbeat Playlist", duration: "120m", durationMinutes: 120, category: "Retail", usageCount: 12, spacesCount: 2, lastPlayed: "yesterday", isScheduled: true },
  { id: "a5", title: "Nature Walk", duration: "45m", durationMinutes: 45, category: "Meditation", usageCount: 3, spacesCount: 1, lastPlayed: "1 week ago", isScheduled: false },
  { id: "a6", title: "Evening Rest", duration: "90m", durationMinutes: 90, category: "Yoga", usageCount: 14, spacesCount: 2, lastPlayed: "3 days ago", isScheduled: true },
];

export default function LibraryAudioClient() {
  const [query, setQuery] = useState("");
  const [audioView, setAudioView] = useState<"list" | "grid">("list");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return library;
    return library.filter((item) => {
      const haystack = `${item.title} ${item.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query]);

  const handleAudioAction = (action: "play" | "edit" | "delete" | "addToPlaylist", audioId: string) => {
    console.log(`[v0] Audio action: ${action} on ${audioId}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">All Audio</h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse and manage your complete audio library
              </p>
            </div>

            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-8 py-3 flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                aria-label="Search audio"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search audio..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <span className="text-sm">×</span>
                </button>
              )}
            </div>
          </div>

          {/* View toggle */}
          <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setAudioView("grid")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                audioView === "grid"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              )}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              onClick={() => setAudioView("list")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                audioView === "list"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              )}
              title="List view"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6">
          {filteredLibrary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4 max-w-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gray-100">
                  <FileAudio size={28} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">No audio found</h2>
                <p className="text-sm text-gray-600">
                  {query ? "Try adjusting your search" : "Upload audio files to build your library"}
                </p>
                {!query && (
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors mt-4"
                  >
                    <Plus size={16} />
                    Upload audio
                  </button>
                )}
              </div>
            </div>
          ) : audioView === "grid" ? (
            <AudioGrid items={filteredLibrary} onAudioAction={handleAudioAction} />
          ) : (
            <AudioList items={filteredLibrary} onAudioAction={handleAudioAction} />
          )}
        </div>
      </div>

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(files) => {
          console.log("[v0] Files uploaded:", files);
        }}
      />
    </div>
  );
}
