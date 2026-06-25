"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ImagePlus,
  ListMusic,
  Music2,
  Palette,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";

export type Playlist = {
  id: string;
  title: string;
  description?: string;
  trackCount: number;
  totalDuration: string;
  usedInSchedule: boolean;
  spacesCount: number;
  lastModified: string;
  cover?: string;
  coverColor?: "slate" | "indigo" | "blue" | "purple" | "emerald";
};

const coverGradients = {
  slate: "from-slate-500 via-slate-600 to-slate-900",
  indigo: "from-indigo-500 via-indigo-600 to-indigo-900",
  blue: "from-blue-500 via-blue-600 to-blue-900",
  purple: "from-[#7C3AED] via-[#8B5CF6] to-[#202538]",
  emerald: "from-emerald-500 via-emerald-600 to-emerald-900",
} as const;

type CoverKey = keyof typeof coverGradients;

const COVER_LABELS: Record<CoverKey, string> = {
  slate: "Slate",
  indigo: "Indigo",
  blue: "Blue",
  purple: "Purple",
  emerald: "Emerald",
};

function resetForm(setters: {
  setName: (v: string) => void;
  setDesc: (v: string) => void;
  setCover: (v: string | undefined) => void;
  setColor: (v: CoverKey) => void;
  setError: (v: string | null) => void;
  fileInput: HTMLInputElement | null;
  coverFile: { current: File | null };
}) {
  setters.setName("");
  setters.setDesc("");
  setters.setCover(undefined);
  setters.setColor("indigo");
  setters.setError(null);
  setters.coverFile.current = null;
  if (setters.fileInput) setters.fileInput.value = "";
}

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
  onCreatePlaylist?: (playlist: Playlist, options?: { coverFile?: File | null }) => void | Promise<void>;
  onAddToPlaylist?: (playlistId: string, trackId: string) => void;
}) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);
  const [selectedCoverColor, setSelectedCoverColor] = useState<CoverKey>("indigo");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileRef = useRef<File | null>(null);

  void _playlists;
  void _onAddToPlaylist;

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleCreate = () => {
    if (!newPlaylistName.trim()) return;

    const playlist: Playlist = {
      id: Math.random().toString(36),
      title: newPlaylistName.trim(),
      description: newPlaylistDesc.trim() || undefined,
      trackCount: 0,
      totalDuration: "0m",
      usedInSchedule: false,
      spacesCount: 0,
      lastModified: new Date().toISOString(),
      coverColor: coverFileRef.current ? undefined : selectedCoverColor,
    };

    void onCreatePlaylist?.(playlist, { coverFile: coverFileRef.current });
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    resetForm({
      setName: setNewPlaylistName,
      setDesc: setNewPlaylistDesc,
      setCover: setCoverPreview,
      setColor: setSelectedCoverColor,
      setError,
      fileInput: fileInputRef.current,
      coverFile: coverFileRef,
    });
    onClose();
  };

  const handleClose = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    resetForm({
      setName: setNewPlaylistName,
      setDesc: setNewPlaylistDesc,
      setCover: setCoverPreview,
      setColor: setSelectedCoverColor,
      setError,
      fileInput: fileInputRef.current,
      coverFile: coverFileRef,
    });
    onClose();
  };

  if (!open) return null;

  const canCreate = newPlaylistName.trim().length > 0;
  const activeGradient = coverGradients[selectedCoverColor];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-playlist-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden sm:max-h-none",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn(dashboardIconChip, "h-8 w-8 rounded-lg")}>
                <Sparkles size={15} className="text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <span className={dashboardSectionLabel}>New program</span>
            </div>
            <h2 id="create-playlist-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Create playlist
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-sm")}>
              Name your program, add a description, and choose a cover look.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex gap-5">
            <div className="shrink-0">
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
                  if (coverPreview) URL.revokeObjectURL(coverPreview);
                  coverFileRef.current = f;
                  setCoverPreview(URL.createObjectURL(f));
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "group relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ring-1 ring-gray-100 transition-all hover:ring-[#A473FF]/30 dark:ring-zinc-700",
                  !coverPreview && activeGradient
                )}
              >
                {coverPreview ? (
                  <>
                    <Image src={coverPreview} alt="" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-2 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Change
                    </span>
                  </>
                ) : (
                  <Music2 size={28} className="text-white/80" strokeWidth={1.8} />
                )}
              </button>

              {coverPreview && (
                <button
                  type="button"
                  onClick={() => {
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    coverFileRef.current = null;
                    setCoverPreview(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-2 w-full text-center text-[10px] font-medium text-gray-400 hover:text-gray-600"
                >
                  Remove image
                </button>
              )}

              {!coverPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex w-full items-center justify-center gap-1 text-[10px] font-medium text-gray-400 hover:text-[#8B5CF6]"
                >
                  <ImagePlus size={11} />
                  Upload
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <label htmlFor="playlist-name" className={dashboardSectionLabel}>
                  Name
                </label>
                <input
                  id="playlist-name"
                  autoFocus
                  type="text"
                  placeholder="e.g. Lobby Morning Mix"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreate) handleCreate();
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label htmlFor="playlist-desc" className={dashboardSectionLabel}>
                  Description
                  <span className="ml-1 normal-case tracking-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="playlist-desc"
                  placeholder="What's this playlist for?"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {!coverPreview && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Palette size={14} className="text-gray-400" />
                <span className={dashboardSectionLabel}>Cover color</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(coverGradients) as CoverKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCoverColor(key);
                      setError(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                      selectedCoverColor === key
                        ? "bg-[#A473FF]/10 text-[#7C3AED] ring-1 ring-[#A473FF]/25 dark:text-[#A473FF]"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-zinc-800/50 dark:text-zinc-400"
                    )}
                    aria-pressed={selectedCoverColor === key}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full bg-gradient-to-br",
                        coverGradients[key]
                      )}
                    />
                    {COVER_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-zinc-700/60">
          <p className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">
            <ListMusic size={12} />
            Ready to add tracks after creation
          </p>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <X size={15} strokeWidth={2} className="shrink-0 opacity-70" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium transition-opacity",
                canCreate
                  ? "text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
              style={
                canCreate
                  ? {
                      background:
                        "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
                    }
                  : undefined
              }
            >
              <Plus size={16} strokeWidth={2} className="shrink-0" />
              Create
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
