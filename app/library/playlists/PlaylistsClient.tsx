"use client";

import React, { useEffect, useState, useRef } from "react";
import { Plus, Music } from "lucide-react";
import { useRouter } from "next/navigation";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistModal from "../components/PlaylistModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Playlist } from "../components/PlaylistModal";

// Mock sample playlists
const samplePlaylists: Playlist[] = [
  {
    id: "p1",
    title: "Morning Yoga",
    description: "Energizing flows to start your day",
    trackCount: 3,
    totalDuration: "180m",
    usedInSchedule: true,
    spacesCount: 2,
    lastModified: "2 days ago",
    coverColor: "indigo",
  },
  {
    id: "p2",
    title: "Evening Relaxation",
    description: "Calm and soothing soundscapes",
    trackCount: 5,
    totalDuration: "300m",
    usedInSchedule: true,
    spacesCount: 3,
    lastModified: "1 week ago",
    coverColor: "blue",
  },
  {
    id: "p3",
    title: "Meditation Session",
    description: "Deep meditation and mindfulness",
    trackCount: 4,
    totalDuration: "240m",
    usedInSchedule: false,
    spacesCount: 0,
    lastModified: "3 days ago",
    coverColor: "purple",
  },
];

export default function LibraryPlaylistsClient() {
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>(samplePlaylists);

  // ref to keep the latest playlists for event handler comparisons
  const playlistsRef = useRef<Playlist[]>(playlists);

  const PLAYLISTS_STORAGE_KEY = "aa_playlists";

  // load playlists from localStorage (persisted) if available
  useEffect(() => {
    // run in next tick to avoid setState during render/effect sync warnings
    const t = setTimeout(() => {
      try {
        if (typeof window === "undefined") return;
        const raw = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
        console.debug?.("[playlists] load from localStorage:", PLAYLISTS_STORAGE_KEY, raw);
        if (raw) {
          const parsed = JSON.parse(raw) as Playlist[];
          console.debug?.("[playlists] parsed on load:", parsed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPlaylists(parsed);
            return;
          }
        }
        // fallback to sample playlists
        setPlaylists(samplePlaylists);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // persist playlists to localStorage on change and notify other parts of the app
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const nextJson = JSON.stringify(playlists);
      const existing = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      console.debug?.("[playlists] persist check", { key: PLAYLISTS_STORAGE_KEY, existing, nextJson });
      // only write/dispatch if the stored value actually differs
      if (existing !== nextJson) {
        console.debug?.("[playlists] writing to localStorage", PLAYLISTS_STORAGE_KEY);
        window.localStorage.setItem(PLAYLISTS_STORAGE_KEY, nextJson);
        // update the ref first so same-window handlers don't treat this as an external change
        playlistsRef.current = playlists;
        // dispatch a custom event so other clients/components can react without relying on storage events
        window.dispatchEvent(new CustomEvent("aa:playlists-updated", { detail: { count: playlists.length } }));
      } else {
        // ensure ref still matches current playlists
        playlistsRef.current = playlists;
      }
    } catch {
      /* ignore */
    }
  }, [playlists]);

  // keep the ref in sync with the latest playlists (covers initial mount too)
  useEffect(() => {
    playlistsRef.current = playlists;
  }, [playlists]);

  // keep playlists in sync if updated in another tab or elsewhere in the app
  useEffect(() => {
    if (typeof window === "undefined") return;


    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PLAYLISTS_STORAGE_KEY) return;
      try {
        console.debug?.("[playlists] storage event", event);
        const raw = event.newValue;
        if (!raw) {
          // only update if different
          if (playlistsRef.current.length !== samplePlaylists.length || JSON.stringify(playlistsRef.current) !== JSON.stringify(samplePlaylists)) {
            setPlaylists(samplePlaylists);
            playlistsRef.current = samplePlaylists;
          }
          return;
        }
        const parsed = JSON.parse(raw) as Playlist[];
        console.debug?.("[playlists] storage parsed:", parsed);
        if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(playlistsRef.current)) {
          console.debug?.("[playlists] storage -> updating playlists state");
          setPlaylists(parsed);
          playlistsRef.current = parsed;
        }
      } catch {
        // ignore
      }
    };

    const handleCustom = () => {
      try {
        console.debug?.("[playlists] custom aa:playlists-updated event received");
        const raw = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Playlist[];
        console.debug?.("[playlists] custom parsed:", parsed);
        if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(playlistsRef.current)) {
          console.debug?.("[playlists] custom -> updating playlists state");
          setPlaylists(parsed);
          playlistsRef.current = parsed;
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("aa:playlists-updated", handleCustom as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("aa:playlists-updated", handleCustom as EventListener);
    };
  }, []);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlaylistForDelete, setSelectedPlaylistForDelete] = useState<Playlist | null>(null);
  const router = useRouter();

  const handlePlaylistClick = (playlistId: string) => {
    router.push(`/library/playlists/${playlistId}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Playlists</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage playback programs for your spaces
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPlaylistModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7] transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>New playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6">
          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4 max-w-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gray-100">
                  <Music size={28} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">No playlists yet</h2>
                <p className="text-sm text-gray-600">
                  Create your first playlist to organize and reuse audio content across your spaces.
                </p>
                <button
                  onClick={() => setPlaylistModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-5 py-2.5 text-sm font-medium hover:bg-[#E7E7E7] transition-colors mt-4"
                >
                  <Plus size={16} />
                  Create playlist
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={handlePlaylistClick}
                    onEdit={(id, newTitle) => {
                      if (!newTitle) return;
                      setPlaylists((prev) => prev.map((pl) => (pl.id === id ? { ...pl, title: newTitle } : pl)));
                    }}
                    onDelete={(id) => {
                      const p = playlists.find((pl) => pl.id === id) || null;
                      setSelectedPlaylistForDelete(p);
                      setDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create playlist modal */}
      <PlaylistModal
        open={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        playlists={playlists}
        onCreatePlaylist={(playlist) => {
          setPlaylists((prev) => [...prev, playlist]);
          console.log("[v0] Playlist created:", playlist);
        }}
        onAddToPlaylist={(playlistId, trackId) => {
          console.log("[v0] Added track to playlist:", playlistId, trackId);
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete playlist"
        description={`This will permanently delete "${selectedPlaylistForDelete?.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedPlaylistForDelete(null);
        }}
        onConfirm={() => {
          setPlaylists((prev) => prev.filter((p) => p.id !== selectedPlaylistForDelete?.id));
          setSelectedPlaylistForDelete(null);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
