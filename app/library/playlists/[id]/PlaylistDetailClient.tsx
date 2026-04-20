"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Music, Clock, List, Edit, Trash, Upload } from "lucide-react";
import UploadModal from "../../components/UploadModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Playlist } from "../../components/PlaylistModal";
import AudioVisual from "../../components/AudioVisual";

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

  // per request: show the literal title (may be `undefined`) prefixed with "Playlist"
  const displayTitle = `Playlist ${String(playlist.title)}`;
  const displayDescription = playlist.description ?? "A curated playlist";

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
  }));

  return (
    <div className="min-h-screen overflow-auto">
      {/* Hero (no page background) */}
      <section className="w-full">
  <div className="w-full h-[26vh] md:h-[32vh] lg:h-[36vh] flex items-start pt-6">
          <div className="max-w-8xl mx-auto w-full px-6">
            {/* admin toolbar */}
                <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">Library / Playlists / <span className="text-gray-700 font-medium">{playlist.title}</span></div>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                    setIsEditing(true);
                    setName(playlist.title ?? "");
                    setDescription(playlist.description ?? "");
                  }} className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-emerald-100 min-w-[104px]">
                  <Edit size={14} />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button onClick={() => setDeleteOpen(true)} className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-md text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-100 min-w-[104px]">
                  <Trash size={14} />
                  <span className="hidden sm:inline">Delete</span>
                </button>

                <button onClick={() => setUploadOpen(true)} className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-md text-sm font-medium text-emerald-800 bg-white border border-emerald-100 hover:bg-emerald-50 transition focus:outline-none focus:ring-2 focus:ring-emerald-100 min-w-[104px]">
                  <Upload size={14} />
                  <span className="hidden sm:inline">Add audio</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className={`flex-shrink-0 w-36 h-36 md:w-44 md:h-44 rounded-md overflow-hidden ${playlist.cover ? 'bg-black/5' : `bg-gradient-to-br ${coverGradient}`} shadow-sm flex items-center justify-center`}>
                {playlist.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={playlist.cover} alt={displayTitle} className="w-full h-full object-cover" />
                ) : (
                  <Music size={56} className={playlist.cover ? 'text-gray-600' : 'text-white/90'} />
                )}
              </div>

              <div className="flex-1 text-gray-900">
                <div className="text-sm uppercase tracking-wider text-gray-500">Playlist</div>
                {isEditing ? (
                  <div className="mt-1">
                    <input
                      ref={titleRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => saveChanges()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveChanges();
                        if (e.key === "Escape") {
                          setIsEditing(false);
                          setName(playlist.title ?? "");
                          setDescription(playlist.description ?? "");
                        }
                      }}
                      className="w-full mt-1 text-2xl md:text-3xl font-semibold rounded-md border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                    <textarea
                      ref={descRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => saveChanges()}
                      className="w-full mt-2 text-sm text-gray-700 max-w-2xl rounded-md border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      rows={2}
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="mt-1 text-2xl md:text-3xl font-semibold">{displayTitle}</h1>
                    <p className="mt-1 text-sm text-gray-700 max-w-2xl">{displayDescription}</p>
                  </>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md bg-gray-100">
                    <Clock size={14} /> {playlist.totalDuration}
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md bg-gray-100">
                    <List size={14} /> {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md bg-gray-100">
                    <span>Spaces</span>
                    <span className="font-medium">{playlist.spacesCount ?? 0}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md bg-gray-100">
                    <span>Last modified</span>
                    <span className="font-medium">{playlist.lastModified ?? 'now'}</span>
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
          showCategory={false}
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
                    <AudioVisual size={36} color={playlist.coverColor} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')}</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">{Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
