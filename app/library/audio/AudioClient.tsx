"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, FileAudio, Edit, Trash } from "lucide-react";
import AudioGrid from "../components/AudioGrid";
import AudioVisual from "../components/AudioVisual";
import ViewToggle from "../../players/components/ViewToggle";
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
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [uploadOpen, setUploadOpen] = useState(false);

  type Playlist = { id: string; title?: string; trackIds?: string[]; tracks?: string[]; items?: string[] };
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aa_playlists");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPlaylists(parsed as Playlist[]);
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

    return library.filter((item) => {
      // playlist filter
      if (activeCategory !== "All" && activeCategory.startsWith("pl:")) {
        const pid = activeCategory.replace("pl:", "");
        const pl = playlists.find((p) => String(p.id) === pid);
        if (pl) {
          const maybeIds = pl.trackIds ?? pl.tracks ?? pl.items ?? [];
          let ids: string[] = [];
          if (Array.isArray(maybeIds) && maybeIds.every((x) => typeof x === "string")) {
            ids = maybeIds as string[];
          }
          if (ids.length > 0) return ids.includes(item.id);
          if (pl.title && item.category !== pl.title) return false;
        }
      } else if (activeCategory !== "All" && item.category !== activeCategory) {
        return false;
      }

      if (tokens.length === 0) return true;
      const hay = `${item.title} ${item.category} ${item.duration}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [query, activeCategory, playlists]);

  const totalCount = library.length;
  const filteredCount = filteredLibrary.length;

  const singerMap: Record<string, string> = {
    a1: "Lila Blue",
    a2: "Deep Focusors",
    a3: "Lobby Ensemble",
    a4: "Upbeat Co.",
    a5: "Nature Choir",
    a6: "Evening Strings",
  };

  const handleAudioAction = (action: "play" | "edit" | "delete" | "addToPlaylist", audioId: string) => {
    console.log(`[v0] Audio action: ${action} on ${audioId}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">All Audio</h1>
            <p className="mt-1 text-sm text-gray-500">Browse and manage your complete audio library</p>
          </div>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
          >
            <Plus size={16} />
            <span>New audio</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6">
          {filteredLibrary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileAudio size={48} className="text-gray-300" />
              <h2 className="mt-6 text-lg font-semibold">No audio found</h2>
            </div>
          ) : audioView === "grid" ? (
            <AudioGrid items={filteredLibrary} onAudioAction={handleAudioAction} />
          ) : (
            <div className="space-y-2">
              {filteredLibrary.map((t) => (
                <div
                  key={t.id}
                  className="group grid grid-cols-[48px_1fr_96px] gap-4 items-center p-3 rounded-lg  border-gray-100 bg-white hover:bg-gray-50 hover:shadow-sm transition-all duration-150"
                >
                  <div className="flex items-center justify-center">
                    <AudioVisual size={36} color="#7318FF" />
                  </div>

                  <div className="min-w-0 relative">
                    <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{singerMap[t.id] ?? "Unknown Artist"}</div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <div className="text-right text-sm text-gray-500">{t.duration}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleAudioAction("edit", t.id)} title="Edit" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleAudioAction("delete", t.id)} title="Delete" className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar (under listing) */}
      <div className="border-gray-100 bg-white">
        <div className="px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full max-w-md">
              {/* Playlist selector (if playlists available) */}
              {playlists.length > 0 && (
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="text-sm bg-[#F3F4F6] rounded-md px-3 py-2"
                >
                  <option value="All">All</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={`pl:${p.id}`}>
                      {p.title ?? `Playlist ${p.id}`}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input aria-label="Search audio" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search audio..." className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[#F3F4F6]" />
              </div>

              <div className="text-sm text-gray-600 whitespace-nowrap">{query ? `${filteredCount} of ${totalCount}` : `All ${totalCount}`}</div>
            </div>

            <div className="flex items-center gap-3">
              <ViewToggle view={audioView} onChange={(v) => setAudioView(v)} />
              <button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-3 py-2 text-sm font-medium hover:bg-[#E7E7E7]">
                <Plus size={14} />
                <span>New audio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(files) => console.log("[v0] Files uploaded:", files)} />
    </div>
  );
}

