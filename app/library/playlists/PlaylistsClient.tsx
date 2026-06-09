"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Music, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistModal from "../components/PlaylistModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Playlist } from "../components/PlaylistModal";
import AudioToolbar from "../components/AudioToolbar";
import { getApiClient } from "@/lib/api-client";
import { apiPlaylistToUi, isValidPlaylistId } from "@/lib/playlist-mapper";

const PLAYLISTS_STORAGE_KEY = "aa_playlists";

export default function LibraryPlaylistsClient() {
  const apiClient = getApiClient();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlaylistForDelete, setSelectedPlaylistForDelete] = useState<Playlist | null>(null);
  const [query, setQuery] = useState("");

  const persistCache = useCallback((items: Playlist[]) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(
        new CustomEvent("aa:playlists-updated", { detail: { count: items.length } })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listPlaylists();
      const mapped = (res.playlists ?? [])
        .map((p) => apiPlaylistToUi(p))
        .filter((p): p is Playlist => p !== null);
      setPlaylists(mapped);
      persistCache(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
      try {
        const raw = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Playlist[];
          if (Array.isArray(parsed)) {
            setPlaylists(
              parsed.filter((p) => isValidPlaylistId(p?.id))
            );
          }
        }
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }, [apiClient, persistCache]);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const filteredPlaylists = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [playlists, query]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const perPageOptions = [5, 10, 20, 50];
  const filteredCount = filteredPlaylists.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedPlaylists = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPlaylists.slice(start, start + perPage);
  }, [filteredPlaylists, page, perPage]);

  const navigateToPlaylist = (playlist: Playlist) => {
    const id = playlist.id;
    if (!isValidPlaylistId(id)) {
      setError("This playlist cannot be opened (missing id). Refresh and try again.");
      return;
    }
    router.push(`/library/playlists/${id}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white ">
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
              className={
                `group inline-flex items-center gap-3 h-12 px-5 bg-white text-gray-900 font-medium text-sm rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg hover:translate-y-0.5 cursor-pointer`
              }
            >
              <span className="inline-flex items-center justify-center transition-colors">
                <Plus size={16} strokeWidth={1.9} className="text-zinc-500 group-hover:text-[#A473FF] transition-colors" />
              </span>

              <span>New playlist</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6">
          <div
            className="
              bg-white
              rounded-[28px]
              border
              border-gray-100
              shadow-[0_8px_30px_rgba(0,0,0,0.04)]
              flex
              flex-col
              min-h-[calc(100vh-220px)]
              overflow-hidden
            "
          >
            <div className="p-6 flex-1 overflow-auto">

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: perPage || 6 }).map((_, i) => (
                      <div key={i} className="h-36 bg-gray-200 rounded-xl border border-gray-200" aria-hidden="true" />
                    ))}
                  </div>
                </div>
              ) : paginatedPlaylists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gray-100">
                      <Music size={28} className="text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">No playlists yet</h2>
                    <p className="text-sm text-gray-600">
                      Create your first playlist to organize tracks for scheduling and playback.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPlaylistModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#A473FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7A42FF]"
                    >
                      <Plus size={16} />
                      Create playlist
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedPlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onClick={() => navigateToPlaylist(playlist)}
                      onEdit={async (id, newTitle) => {
                        if (!newTitle?.trim()) return;
                        try {
                          await apiClient.updatePlaylist(id, { title: newTitle.trim() });
                          await loadPlaylists();
                        } catch {
                          setPlaylists((prev) =>
                            prev.map((pl) =>
                              pl.id === id ? { ...pl, title: newTitle.trim() } : pl
                            )
                          );
                        }
                      }}
                      onDelete={(id) => {
                        const p = playlists.find((pl) => pl.id === id) || null;
                        setSelectedPlaylistForDelete(p);
                        setDeleteOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}

            </div>

            <div className="border-t border-gray-100">
              {loading ? (
                <div className="p-4">
                  <div className="h-12 bg-gray-200 rounded-2xl border border-gray-200 w-full animate-pulse" aria-hidden="true" />
                </div>
              ) : (
                <AudioToolbar
                  query={query}
                  setQuery={setQuery}
                  filteredCount={filteredCount}
                  totalCount={playlists.length}
                  page={page}
                  setPage={setPage}
                  perPage={perPage}
                  setPerPage={setPerPage}
                  perPageOptions={perPageOptions}
                  totalPages={totalPages}
                  placeholder="Search by title, track."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <PlaylistModal
        open={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        playlists={playlists}
        onCreatePlaylist={async (playlist) => {
          try {
            const res = await apiClient.createPlaylist({
              title: playlist.title,
              description: playlist.description,
              coverColor: playlist.coverColor,
            });
            const created = apiPlaylistToUi(res.playlist);
            if (!created || !isValidPlaylistId(created.id)) {
              setError("Playlist was created but the server did not return an id. Refresh the list.");
              await loadPlaylists();
              return;
            }
            setPlaylists((prev) => {
              const next = [created, ...prev];
              persistCache(next);
              return next;
            });
            setPlaylistModalOpen(false);
            router.push(`/library/playlists/${created.id}`);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Failed to create playlist"
            );
          }
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
        onConfirm={async () => {
          const id = selectedPlaylistForDelete?.id;
          if (!id) return;
          try {
            await apiClient.deletePlaylist(id);
            await loadPlaylists();
          } catch {
            setPlaylists((prev) => prev.filter((p) => p.id !== id));
            persistCache(playlists.filter((p) => p.id !== id));
          }
          setSelectedPlaylistForDelete(null);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
