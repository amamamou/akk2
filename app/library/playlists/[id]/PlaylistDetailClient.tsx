"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Music, Plus, Edit, Trash, Check, Loader2, X } from "lucide-react";
import { cn } from "@/utils/cn";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Playlist } from "../../components/PlaylistModal";
import { getApiClient } from "@/lib/api-client";
import { apiPlaylistToUi } from "@/lib/playlist-mapper";
import type { PlaylistTrackInfo } from "@/types/api";

export default function PlaylistDetailClient({ playlistId }: { playlistId: string }) {
  const apiClient = getApiClient();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaOptions, setMediaOptions] = useState<{ id: string; title: string }[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getPlaylist(playlistId);
      const ui = apiPlaylistToUi(res.playlist);
      setPlaylist(ui);
      setTracks(res.playlist.tracks ?? []);
      setName(ui.title);
      setDescription(ui.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlist");
    } finally {
      setLoading(false);
    }
  }, [apiClient, playlistId]);

  useEffect(() => {
    void loadPlaylist();
  }, [loadPlaylist]);

  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select?.();
    }, 50);
    return () => clearTimeout(t);
  }, [isEditing]);

  const openMediaPicker = async () => {
    try {
      const res = await apiClient.listMedia();
      setMediaOptions(
        (res.media ?? []).map((m) => ({ id: m.id, title: m.title || "Untitled" }))
      );
      setMediaPickerOpen(true);
    } catch {
      setError("Could not load media library");
    }
  };

  async function saveChanges() {
    if (!playlist) return;
    const trimmed = name.trim();
    const descTrim = description.trim();
    setSaving(true);
    try {
      const res = await apiClient.updatePlaylist(playlist.id, {
        title: trimmed || playlist.title,
        description: descTrim,
      });
      const ui = apiPlaylistToUi(res.playlist);
      setPlaylist(ui);
      setTracks(res.playlist.tracks ?? []);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function removeTrack(itemId: string) {
    try {
      const res = await apiClient.removePlaylistItem(playlistId, itemId);
      const ui = apiPlaylistToUi(res.playlist);
      setPlaylist(ui);
      setTracks(res.playlist.tracks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove track");
    }
  }

  async function addTrack(mediaId: string) {
    try {
      const res = await apiClient.addPlaylistItem(playlistId, { mediaId });
      const ui = apiPlaylistToUi(res.playlist);
      setPlaylist(ui);
      setTracks(res.playlist.tracks ?? []);
      setMediaPickerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add track");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading playlist…
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-8 py-12 text-sm text-gray-600">
        {error ?? "Playlist not found."}
      </div>
    );
  }

  const displayTitle = playlist.title ?? "Untitled playlist";
  const hasChanges =
    name.trim() !== (playlist.title ?? "") ||
    description.trim() !== (playlist.description ?? "");

  const gradientMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-700",
    blue: "from-blue-500 to-blue-700",
    purple: "from-purple-500 to-purple-700",
    emerald: "from-emerald-500 to-emerald-700",
    slate: "from-slate-400 to-slate-600",
  };
  const coverGradient = gradientMap[playlist.coverColor || "indigo"];

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen overflow-auto">
      {error && (
        <div className="mx-8 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="w-full">
        <div className="w-full px-8 py-6 flex items-center">
          <div className="max-w-8xl mx-auto w-full">
            <div className="mb-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void openMediaPicker()}
                className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
              >
                <Plus size={16} />
                <span>Add track</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div
                className={`flex-shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-md overflow-hidden bg-gradient-to-br ${coverGradient} shadow-sm flex items-center justify-center`}
              >
                <Music size={56} className="text-white/90" />
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="mt-2 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <label className="text-xs text-gray-500">Title</label>
                    <input
                      ref={titleRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 text-2xl font-semibold text-gray-900 border-0 focus:outline-none"
                    />
                    <label className="mt-3 block text-xs text-gray-500">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full mt-1 text-sm text-gray-600 border-0 focus:outline-none"
                      rows={3}
                    />
                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setName(playlist.title ?? "");
                          setDescription(playlist.description ?? "");
                        }}
                        className="px-3 py-1 text-sm text-gray-700 border rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveChanges()}
                        disabled={!hasChanges || saving}
                        className={cn(
                          "px-3 py-1 text-sm rounded-md flex items-center gap-1",
                          hasChanges
                            ? "bg-[#A473FF] text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        )}
                      >
                        <Check size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 truncate">
                        {displayTitle}
                      </h1>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true);
                          setName(playlist.title ?? "");
                          setDescription(playlist.description ?? "");
                        }}
                        className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteOpen(true)}
                        className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                    {playlist.description ? (
                      <p className="mt-1 text-sm text-gray-500">{playlist.description}</p>
                    ) : null}
                  </>
                )}

                <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="text-xs text-gray-500">Duration </span>
                    <span className="font-semibold text-gray-900">{playlist.totalDuration}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Tracks </span>
                    <span className="font-semibold text-gray-900">{playlist.trackCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mt-6 pb-24">
        <div className="max-w-8xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b flex justify-between">
              <div className="text-sm font-semibold text-gray-700">Tracks</div>
              <div className="text-sm text-gray-500">{tracks.length} items</div>
            </div>
            {tracks.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-500">
                No tracks yet. Use Add track to pull audio from your library.
              </div>
            ) : (
              tracks.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[48px_1fr_96px_40px] gap-4 items-center px-6 py-4 hover:bg-gray-50 border-t border-gray-50"
                >
                  <Music size={20} className="text-gray-400 mx-auto" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{formatDuration(t.duration)}</div>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    #{t.position + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeTrack(t.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs"
                    title="Remove"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold text-gray-900">Add track from library</h3>
              <button type="button" onClick={() => setMediaPickerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <ul className="max-h-80 overflow-auto py-2">
              {mediaOptions.length === 0 ? (
                <li className="px-4 py-6 text-sm text-gray-500 text-center">
                  No media in library. Upload audio first.
                </li>
              ) : (
                mediaOptions.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => void addTrack(m.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {m.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete playlist"
        description={`This will permanently delete "${playlist.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await apiClient.deletePlaylist(playlist.id);
            router.push("/library/playlists");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete");
          }
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
