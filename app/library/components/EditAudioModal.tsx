"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Disc3, Loader2, Pencil, User, X } from "lucide-react";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export default function EditAudioModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: { id: string; title: string; singer?: string } | null;
  onClose: () => void;
  onSave: (v: { id: string; title: string; singer?: string }) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [singer, setSinger] = useState("");
  const [initialState, setInitialState] = useState<{ title: string; singer: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setSinger(initial.singer ?? "");
      setInitialState({ title: initial.title, singer: initial.singer ?? "" });
    } else {
      setTitle("");
      setSinger("");
      setInitialState({ title: "", singer: "" });
    }
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => titleInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  const hasChanges = Boolean(
    initialState &&
      title.trim().length > 0 &&
      (initialState.title !== title || initialState.singer !== singer)
  );
  const canSave = hasChanges && !saving;

  async function handleSave() {
    if (!initial || !canSave) return;
    setSaving(true);
    try {
      await onSave({
        id: initial.id,
        title: title.trim(),
        singer: singer.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-audio-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn(dashboardIconChip, "h-8 w-8 rounded-lg")}>
                <Pencil size={15} className="text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <span className={dashboardSectionLabel}>Library</span>
            </div>
            <h2 id="edit-audio-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Edit audio
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-sm")}>
              Update the track title and artist label shown across your library.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-audio-title-input" className={dashboardSectionLabel}>
                Title
              </label>
              <input
                id="edit-audio-title-input"
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Jazz"
                disabled={saving}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="edit-audio-artist" className={dashboardSectionLabel}>
                Artist
              </label>
              <input
                id="edit-audio-artist"
                type="text"
                value={singer}
                onChange={(e) => setSinger(e.target.value)}
                placeholder="e.g. Studio Ensemble"
                disabled={saving}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-zinc-700/60">
          <p className="hidden items-center gap-1.5 text-xs sm:flex">
            {hasChanges ? (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <Disc3 size={12} />
                Unsaved changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <User size={12} />
                No changes
              </span>
            )}
          </p>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <X size={15} strokeWidth={2} className="shrink-0 opacity-70" />
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
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
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} strokeWidth={2.5} />
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
