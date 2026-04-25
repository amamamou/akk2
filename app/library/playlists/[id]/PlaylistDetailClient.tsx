"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Music, Plus, Edit, Trash, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import UploadModal from "../../components/UploadModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Playlist } from "../../components/PlaylistModal";
// AudioVisual removed — inline neutral waveform glyph used instead

export default function PlaylistDetailClient({ playlistId }: { playlistId: string }) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem("aa_playlists");
        if (raw) {
          const parsed = JSON.parse(raw) as Playlist[];
          const found = parsed.find((p) => p.id === playlistId) || null;
          if (found) {
            setPlaylist(found);
            return;
          }
        }
      } catch {
        /* ignore */
      }

      setPlaylist({
        id: playlistId,
        title: `Playlist ${playlistId}`,
        description: "A curated playlist",
        trackCount: 8,
        totalDuration: "0m",
        usedInSchedule: false,
        spacesCount: 0,
        lastModified: "now",
        cover: undefined,
        coverColor: "indigo",
      });
    }, 0);
    return () => clearTimeout(t);
  }, [playlistId]);

  // focus title when entering edit mode and helper to save edits
  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select?.();
    }, 50);
    return () => clearTimeout(t);
  }, [isEditing]);

  function saveChanges() {
    if (!playlist) return;
    const trimmed = name.trim();
    const descTrim = description.trim();
    setPlaylist((prev) => (prev ? { ...prev, title: trimmed || prev.title, description: descTrim || prev.description } : prev));
    try {
      const raw = localStorage.getItem("aa_playlists");
      if (raw) {
        const parsed = JSON.parse(raw) as Playlist[];
        const updated = parsed.map((p) => (p.id === playlist.id ? { ...p, title: trimmed || p.title, description: descTrim || p.description } : p));
        localStorage.setItem("aa_playlists", JSON.stringify(updated));
      }
    } catch {
      /* ignore */
    }
    setIsEditing(false);
  }

  if (!playlist) return null;

  // display the playlist title cleanly
  const displayTitle = playlist.title ?? "Untitled playlist";
  const hasChanges = (name.trim() !== (playlist.title ?? "")) || (description.trim() !== (playlist.description ?? ""));

  // static gradient map for cover (avoid Tailwind purge on dynamic strings)
  const gradientMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-700",
    blue: "from-blue-500 to-blue-700",
    purple: "from-purple-500 to-purple-700",
    emerald: "from-emerald-500 to-emerald-700",
    slate: "from-slate-400 to-slate-600",
  };
  const coverGradient = gradientMap[playlist.coverColor || "indigo"];
  const tracks = Array.from({ length: Math.max(3, playlist.trackCount) }, (_, i) => ({
    id: `${playlist.id}-t${i + 1}`,
    title: `${displayTitle} — Track ${i + 1}`,
    duration: 180 + i * 15,
    size: Math.round((2.8 + i * 0.3) * 1024 * 1024),
  }));

  // derive artists count: prefer playlist.artistCount, otherwise estimate from tracks
  const maybeArtistCount = (playlist as unknown as { artistCount?: number }).artistCount;
  const artistsCount = typeof maybeArtistCount === 'number' ? maybeArtistCount : Math.max(1, Math.min(6, Math.round((playlist.trackCount ?? tracks.length) / 3)));

  return (
    <div className="min-h-screen overflow-auto">
      {/* Hero (no page background) */}
      <section className="w-full">
  <div className="w-full  px-8 py-6 flex items-center">
          <div className="max-w-8xl mx-auto w-full ">
            <div className="mb-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
              >
                <Plus size={16} />
                <span>New audio</span>
              </button>
            </div>
            {/* compact header (no breadcrumb / actions) */}

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className={`flex-shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-md overflow-hidden ${playlist.cover ? 'bg-black/5' : `bg-gradient-to-br ${coverGradient}`} shadow-sm flex items-center justify-center`}>
                {playlist.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={playlist.cover} alt={displayTitle} className="w-full h-full object-cover" />
                ) : (
                  <Music size={56} className={playlist.cover ? 'text-gray-600' : 'text-white/90'} />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    {isEditing ? (
                      <div className="mt-2 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <label className="text-xs text-gray-500">Title</label>
                        <input
                          ref={titleRef}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveChanges();
                            if (e.key === "Escape") {
                              setIsEditing(false);
                              setName(playlist.title ?? "");
                              setDescription(playlist.description ?? "");
                            }
                          }}
                          className="w-full mt-1 text-2xl md:text-3xl font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0"
                        />

                        <label className="mt-3 text-xs text-gray-500">Description</label>
                        <textarea
                          ref={descRef}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full mt-1 text-sm text-gray-600 bg-transparent border-0 focus:outline-none focus:ring-0"
                          rows={3}
                        />

                        <div className="mt-4 border-t border-gray-200 px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setName(playlist.title ?? "");
                                setDescription(playlist.description ?? "");
                              }}
                              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                            >
                              Cancel
                            </button>

                            <button
                              onClick={() => {
                                if (hasChanges) saveChanges();
                              }}
                              disabled={!hasChanges}
                              className={cn(
                                "px-3 py-1 text-sm font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-2",
                                hasChanges
                                  ? "bg-[#A473FF] text-white hover:bg-[#7A42FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              )}
                            >
                              {hasChanges ? (
                                <>
                                  <Check className="h-4 w-4 inline-block mr-1" />
                                  <span>Save</span>
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 truncate">{displayTitle}</h1>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setName(playlist.title ?? "");
                                setDescription(playlist.description ?? "");
                              }}
                              title="Edit playlist"
                              className="p-1 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteOpen(true)}
                              title="Delete playlist"
                              className="p-1 rounded-md text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-100"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                        {playlist.description ? (
                          <p className="mt-1 text-sm text-gray-500 max-w-3xl">{playlist.description}</p>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                {/* Minimal inline stats: only Duration and Tracks */}
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-500">Duration</span>
                    <span className="text-base font-semibold text-gray-900">{playlist.totalDuration}</span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-500">Tracks</span>
                    <span className="text-base font-semibold text-gray-900">{playlist.trackCount}</span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-gray-500">Artists</span>
                    <span className="text-base font-semibold text-gray-900">{artistsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Upload modal for adding audio */}
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUpload={(files) => {
            console.log('[v0] Uploaded files from detail page:', files);
            // TODO: attach uploaded files to playlist/library
            setUploadOpen(false);
          }}
        />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete playlist"
        description={`This will permanently delete "${playlist.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => {
          setDeleteOpen(false);
        }}
        onConfirm={() => {
          try {
            const raw = localStorage.getItem("aa_playlists");
            if (raw) {
              const parsed = JSON.parse(raw) as Playlist[];
              const updated = parsed.filter((p) => p.id !== playlist.id);
              localStorage.setItem("aa_playlists", JSON.stringify(updated));
            }
          } catch {
            /* ignore */
          }
          setDeleteOpen(false);
          // navigate back to the playlists index
          router.push("/library/playlists");
        }}
      />

      {/* Tracks area (full-width with centered container) */}
  <main className="mt-6 pb-24">
        <div className="max-w-8xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">Tracks</div>
              <div className="text-sm text-gray-500">{tracks.length} items</div>
            </div>

            <div>
              {tracks.map((t) => (
                <div key={t.id} className="grid grid-cols-[48px_1fr_96px] gap-4 items-center px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 15h2v-6H3v6zm4 0h2v-4H7v4zm4 0h2v-10h-2v10zm4 0h2v-7h-2v7zm4 0h2v-5h-2v5z" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')}</span>
                      {typeof (t as unknown as { size?: number }).size === 'number' && (
                        <span className="text-xs text-gray-400">• {(((t as unknown as { size?: number }).size ?? 0) / 1024 / 1024).toFixed(1)}MB</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {typeof (t as unknown as { size?: number }).size === 'number' ? `${(((t as unknown as { size?: number }).size ?? 0) / 1024 / 1024).toFixed(1)}MB` : `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
