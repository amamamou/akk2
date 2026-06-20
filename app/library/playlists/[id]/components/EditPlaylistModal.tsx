"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ImagePlus,
  ListMusic,
  Loader2,
  Music2,
  Palette,
  Pencil,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

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

export default function EditPlaylistModal({
  open,
  name,
  description,
  coverColor,
  saving,
  saved,
  hasChanges,
  titleRef,
  onNameChange,
  onDescriptionChange,
  onCoverColorChange,
  onClose,
  onSave,
}: {
  open: boolean;
  name: string;
  description: string;
  coverColor: CoverKey;
  saving: boolean;
  saved: boolean;
  hasChanges: boolean;
  titleRef: React.RefObject<HTMLInputElement | null>;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCoverColorChange: (v: CoverKey) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  if (!open) return null;

  const canSave = name.trim().length > 0 && hasChanges && !saving;
  const activeGradient = coverGradients[coverColor];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-playlist-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
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
                <Pencil size={15} className="text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <span className={dashboardSectionLabel}>Manage program</span>
            </div>
            <h2 id="edit-playlist-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Edit playlist
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-sm")}>
              Update the name, description, and cover appearance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

              {!coverPreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex w-full items-center justify-center gap-1 text-[10px] font-medium text-gray-400 hover:text-[#8B5CF6]"
                >
                  <ImagePlus size={11} />
                  Upload image
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <label htmlFor="edit-playlist-name" className={dashboardSectionLabel}>
                  Name
                </label>
                <input
                  id="edit-playlist-name"
                  ref={titleRef}
                  type="text"
                  placeholder="e.g. Lobby Morning Mix"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label htmlFor="edit-playlist-desc" className={dashboardSectionLabel}>
                  Description
                  <span className="ml-1 normal-case tracking-normal text-gray-400">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="edit-playlist-desc"
                  placeholder="What's this playlist for?"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
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
                    onClick={() => onCoverColorChange(key)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                      coverColor === key
                        ? "bg-[#A473FF]/10 text-[#7C3AED] ring-1 ring-[#A473FF]/25 dark:text-[#A473FF]"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-zinc-800/50 dark:text-zinc-400"
                    )}
                    aria-pressed={coverColor === key}
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
          <p className="hidden items-center gap-1.5 text-xs sm:flex">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <Check size={12} strokeWidth={2.5} />
                Changes saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <ListMusic size={12} />
                {hasChanges ? "Unsaved changes" : "No changes"}
              </span>
            )}
          </p>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium transition-opacity",
                canSave
                  ? "text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
              style={
                canSave
                  ? {
                      background:
                        "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
                    }
                  : undefined
              }
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export type { CoverKey };
