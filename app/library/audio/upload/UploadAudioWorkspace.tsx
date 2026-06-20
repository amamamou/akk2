"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Upload } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import { persistSingerOverride } from "@/lib/audio-singer-overrides";
import {
  dashboardAccentShadow,
  dashboardContainerClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import UploadWorkflowHero from "./components/UploadWorkflowHero";
import UploadDropzone from "./components/UploadDropzone";
import UploadQueuePanel from "./components/UploadQueuePanel";
import UploadDetailPanel from "./components/UploadDetailPanel";
import type { UploadQueueItem } from "./lib/upload-audio-types";
import {
  durationToUploadMinutes,
  getSubmitBlockMessage,
  isQueueItemValid,
  readAudioDuration,
  sanitizeUploadStem,
  suggestTitleAndArtist,
  validateAudioFile,
} from "./lib/upload-audio-utils";

type UploadAudioWorkspaceProps = {
  variant?: "page" | "modal";
  onCancel?: () => void;
  onComplete?: (count: number) => void;
};

export default function UploadAudioWorkspace({
  variant = "page",
  onCancel,
  onComplete,
}: UploadAudioWorkspaceProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  useEffect(() => {
    void getApiClient()
      .listPlaylists()
      .then((res) => {
        setPlaylists(
          (res.playlists ?? []).map((p) => ({
            id: String(p.id),
            name: String(p.title ?? "Untitled playlist"),
          }))
        );
      })
      .catch(() => setPlaylists([]));
  }, []);

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          /* ignore */
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const t = window.setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select();
    }, 50);
    return () => window.clearTimeout(t);
  }, [selectedId]);

  const updateItem = useCallback((id: string, patch: Partial<UploadQueueItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addFiles = useCallback(async (incoming: File[]) => {
    setGlobalError(null);
    const nextItems: UploadQueueItem[] = [];

    for (const file of incoming) {
      const validationError = validateAudioFile(file);
      if (validationError) {
        setGlobalError(validationError);
        continue;
      }

      const { title, artist } = suggestTitleAndArtist(file.name);
      const durationSeconds = await readAudioDuration(file);

      nextItems.push({
        id: Math.random().toString(36).slice(2),
        file,
        name: file.name,
        size: file.size,
        status: "pending",
        progress: 0,
        title,
        titleTouched: false,
        artist,
        artistTouched: false,
        category: "",
        categoryTouched: false,
        tags: [],
        playlistId: null,
        previewUrl: URL.createObjectURL(file),
        durationSeconds,
      });
    }

    if (nextItems.length === 0) return;

    setItems((prev) => [...prev, ...nextItems]);
    setSelectedId((current) => current ?? nextItems[0]?.id ?? null);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (dropped.length) void addFiles(dropped);
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files ? Array.from(e.target.files) : [];
    if (chosen.length) void addFiles(chosen);
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          /* ignore */
        }
      }
      const next = prev.filter((i) => i.id !== id);
      setSelectedId((current) => (current === id ? next[0]?.id ?? null : current));
      return next;
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.push("/library/audio");
  };

  const markAllItemsTouched = useCallback(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        titleTouched: true,
        artistTouched: true,
        categoryTouched: true,
      }))
    );
  }, []);

  const focusFirstInvalidItem = useCallback((queue: UploadQueueItem[]) => {
    const firstInvalid = queue.find(
      (item) => item.status !== "success" && !isQueueItemValid(item)
    );
    if (firstInvalid) setSelectedId(firstInvalid.id);
  }, []);

  const uploadAll = async () => {
    if (items.length === 0 || isUploading) return;

    const pending = items.filter((i) => i.status !== "success");
    const hasInvalid = pending.some((i) => !isQueueItemValid(i));

    if (hasInvalid) {
      setShowValidation(true);
      markAllItemsTouched();
      focusFirstInvalidItem(items);
      return;
    }

    setGlobalError(null);
    setIsUploading(true);

    const apiClient = getApiClient();
    let success = 0;
    let failed = 0;

    try {
      for (const item of items) {
        if (item.status === "success") {
          success += 1;
          continue;
        }

        updateItem(item.id, { status: "uploading", progress: 0, error: undefined });

        const extMatch = item.file.name.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0] : ".mp3";
        const stem =
          item.file.name.split(".").slice(0, -1).join(".").replace(/[^a-zA-Z0-9]/g, "_") ||
          "audio";
        const sanitizedTitle = sanitizeUploadStem(item.title, stem);
        const uploadBlob =
          item.file.name === `${stem}${ext}`
            ? item.file
            : new File([item.file], `${stem}${ext}`, {
                type: item.file.type || "audio/mpeg",
              });

        try {
          const response = await apiClient.uploadMedia(
            uploadBlob,
            sanitizedTitle,
            durationToUploadMinutes(item.durationSeconds, item.size),
            item.category || "Audio",
            (progressPercent) => updateItem(item.id, { progress: progressPercent }),
            item.tags ?? []
          );

          if (item.artist.trim()) {
            persistSingerOverride(response.media.id, item.artist.trim());
          }

          if (item.playlistId) {
            await apiClient.addPlaylistItem(item.playlistId, {
              mediaId: response.media.id,
            });
          }

          updateItem(item.id, { status: "success", progress: 100 });
          success += 1;
        } catch {
          failed += 1;
          updateItem(item.id, {
            status: "error",
            error: "Upload failed. Try again.",
            progress: 0,
          });
        }
      }

      if (success > 0 && failed === 0) {
        setSuccessCount(success);
        onComplete?.(success);
        window.setTimeout(() => {
          if (variant === "page") router.push("/library/audio");
        }, 1200);
      } else if (failed > 0) {
        setGlobalError(
          "Some files could not be imported due to a server or network issue. Review the queue and try again."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const pendingItems = items.filter((i) => i.status !== "success");
  const allPendingValid =
    pendingItems.length > 0 && pendingItems.every((i) => isQueueItemValid(i));
  const submitBlockMessage = getSubmitBlockMessage(items);
  const canSubmit = allPendingValid && !isUploading;
  const importableCount = pendingItems.length;

  const content = (
    <>
      {variant === "page" && <UploadWorkflowHero fileCount={items.length} />}

      {globalError && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle size={16} className="shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {successCount != null && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          <Check size={16} strokeWidth={2.5} />
          {successCount} {successCount === 1 ? "file" : "files"} imported successfully
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handlePick}
        className="hidden"
      />

      {items.length === 0 ? (
        <UploadDropzone
          dragActive={dragActive}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDrop={handleDrop}
          onBrowse={() => inputRef.current?.click()}
        />
      ) : (
        <div className="space-y-6">
          <UploadDropzone
            compact
            dragActive={dragActive}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDrop={handleDrop}
            onBrowse={() => inputRef.current?.click()}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
            <UploadQueuePanel
              items={items}
              selectedId={selectedId}
              showValidation={showValidation}
              onSelect={setSelectedId}
              onRemove={removeItem}
              onAddMore={() => inputRef.current?.click()}
            />

            {selectedItem ? (
              <UploadDetailPanel
                item={selectedItem}
                playlists={playlists}
                showValidation={showValidation}
                titleRef={titleRef}
                onChange={(patch) => updateItem(selectedItem.id, patch)}
              />
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
                Select a file from the queue to preview and edit details
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isUploading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!canSubmit && items.length > 0 && !isUploading && submitBlockMessage && (
            <p className="text-right text-xs font-medium text-amber-700 dark:text-amber-400">
              {submitBlockMessage}
            </p>
          )}
          <button
            type="button"
            onClick={() => void uploadAll()}
            disabled={!canSubmit}
            title={submitBlockMessage ?? undefined}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
              dashboardAccentShadow
            )}
            style={{
              background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
            }}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importing…
              </>
            ) : canSubmit ? (
              <>
                <Upload size={16} strokeWidth={2} />
                Import {importableCount} {importableCount === 1 ? "file" : "files"}
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2} />
                Import files
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );

  if (variant === "modal") {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <div className={dashboardPageClass}>
      <div className={cn(dashboardContainerClass, "space-y-8")}>{content}</div>
    </div>
  );
}
