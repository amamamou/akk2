"use client";

import React, { useState, useRef } from "react";
import { Music, X, Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";

export type Playlist = {
  id: string;
  title: string;
  description?: string;
  trackCount: number;
  totalDuration: string;
  usedInSchedule: boolean;
  spacesCount: number;
  lastModified: string;
  cover?: string; // URL to cover image
  coverColor?: "slate" | "indigo" | "blue" | "purple" | "emerald"; // gradient color preset
};

export default function PlaylistModal({
  open,
  onClose,
  playlists: _playlists = [],
  onCreatePlaylist,
  onAddToPlaylist: _onAddToPlaylist,
}: {
  open: boolean;
  onClose: () => void;
  playlists?: Playlist[];
  onCreatePlaylist?: (playlist: Playlist) => void;
  onAddToPlaylist?: (playlistId: string, trackId: string) => void;
}) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);
  const [selectedCoverColor, setSelectedCoverColor] = useState<Playlist["coverColor"]>("indigo");

  // Cover gradient presets (shared with PlaylistCard)
  const coverGradients = {
    slate: "from-slate-600 to-slate-800",
    indigo: "from-indigo-500 to-indigo-700",
    blue: "from-blue-500 to-blue-700",
    purple: "from-purple-500 to-purple-700",
    emerald: "from-emerald-500 to-emerald-700",
  } as const;

  // no image presets — use colored gradient swatches with music icon

  // keep unused props referenced to avoid lint errors (they're intentionally unused here)
  void _playlists;
  void _onAddToPlaylist;

  // coverPreview will be created when a file is selected (see input onChange)

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // cleanup preview object URL on unmount
  React.useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const handleCreate = () => {
    if (!newPlaylistName.trim()) return;

    const playlist: Playlist = {
      id: Math.random().toString(36),
      title: newPlaylistName,
      description: newPlaylistDesc,
      trackCount: 0,
      totalDuration: "0m",
      usedInSchedule: false,
      spacesCount: 0,
      lastModified: "now",
      cover: coverPreview,
      coverColor: coverPreview ? undefined : selectedCoverColor,
    };

    onCreatePlaylist?.(playlist);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setCoverPreview(undefined);
    setSelectedCoverColor("indigo");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl mx-4 bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Playlist</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Top row: clickable cover preview + name input */}
          <div className="flex items-center gap-4">
            {/* hidden file input triggered by clicking the cover */}
            <input
              ref={fileInputRef}
              id="playlist-cover-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setError(null);
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                if (!f.type.startsWith("image/")) {
                  setError("Please upload a valid image file.");
                  return;
                }
                // revoke previous
                if (coverPreview) URL.revokeObjectURL(coverPreview);
                const url = URL.createObjectURL(f);
                setCoverPreview(url);
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={cn(
                "w-20 h-20 rounded-md overflow-hidden bg-gradient-to-br flex items-center justify-center relative group cursor-pointer",
                coverGradients[selectedCoverColor as keyof typeof coverGradients]
              )}
            >
              {coverPreview ? (
                <>
                  <Image src={coverPreview} alt="cover preview" fill className="object-cover" />
                  {/* small overlay remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (coverPreview) URL.revokeObjectURL(coverPreview);
                      setCoverPreview(undefined);
                      setSelectedCoverColor("indigo");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove cover image"
                    title="Remove cover image"
                    className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <Music size={28} className="text-white/40" />
              )}

              {/* always-visible hint positioned at the bottom */}
              <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center bg-black/0">
                <span className="text-[10px] text-white/80 bg-black/30 px-2 py-0.5 rounded-none">Upload image</span>
              </div>
            </div>

            <div className="flex-1">
              <input
                autoFocus
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-400 mt-1">Give your playlist a clear, descriptive name.</p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-3">
            <textarea
              placeholder="Description (optional)"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              rows={2}
            />
          </div>

          {/* Small controls: optional small color dots + remove link when an image is present */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(Object.keys(coverGradients) as Array<keyof typeof coverGradients>).map((key) => (
                  <button
                  key={key}
                  onClick={() => {
                    if (coverPreview) {
                      URL.revokeObjectURL(coverPreview);
                      setCoverPreview(undefined);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }
                    setSelectedCoverColor(key);
                    setError(null);
                  }}
                  className={cn(
                    "w-4 h-4 rounded-full bg-gradient-to-br border-2 border-transparent",
                    coverGradients[key],
                    selectedCoverColor === key ? "ring-2 ring-offset-1 ring-gray-900" : ""
                  )}
                  aria-pressed={selectedCoverColor === key}
                  title={key}
                />
              ))}
            </div>

            {/* coverPreview removal is handled by the overlay X on the image; no separate remove button needed */}
          </div>

          

          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

          {/* Actions */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setNewPlaylistName("");
                setNewPlaylistDesc("");
                if (coverPreview) URL.revokeObjectURL(coverPreview);
                setCoverPreview(undefined);
                setSelectedCoverColor("indigo");
                onClose();
              }}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                <X size={14} />
                Cancel
              </span>
            </button>
            <button
              onClick={() => {
                handleCreate();
                onClose();
              }}
              disabled={!newPlaylistName.trim()}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                newPlaylistName.trim()
                  ? "bg-[#A473FF] text-white hover:bg-[#7A42FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7318FF]/40"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
            >
              <>
                <Check size={14} />
                Create
              </>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
