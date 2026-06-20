"use client";

import React from "react";
import { AlertCircle, Check, Loader2, Music2, X } from "lucide-react";
import { dashboardCardClass, dashboardSectionLabel } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import type { UploadQueueItem } from "../lib/upload-audio-types";
import { formatUploadFileSize, getUploadFieldErrors, isQueueItemValid } from "../lib/upload-audio-utils";

export default function UploadQueuePanel({
  items,
  selectedId,
  showValidation,
  onSelect,
  onRemove,
  onAddMore,
}: {
  items: UploadQueueItem[];
  selectedId: string | null;
  showValidation: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}) {
  return (
    <section className={cn(dashboardCardClass, "overflow-hidden")}>
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
        <div>
          <p className={dashboardSectionLabel}>Queue</p>
          <p className="mt-0.5 text-sm font-medium text-gray-950 dark:text-zinc-100">
            {items.length} {items.length === 1 ? "file" : "files"}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddMore}
          className="text-xs font-medium text-[#7C3AED] transition-colors hover:text-[#8B5CF6] dark:text-[#A473FF]"
        >
          Add more
        </button>
      </header>

      <ul>
        {items.map((item) => {
          const selected = selectedId === item.id;
          const invalid =
            item.status !== "success" &&
            !isQueueItemValid(item) &&
            (showValidation ||
              item.titleTouched ||
              item.artistTouched ||
              item.categoryTouched);
          const fieldErrors = getUploadFieldErrors(item);
          const missingCount = Object.keys(fieldErrors).length;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "group relative flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-zinc-800/80 sm:px-5",
                  "hover:bg-[#A473FF]/[0.04] dark:hover:bg-[#A473FF]/[0.06]",
                  selected && "bg-[#A473FF]/[0.04] dark:bg-[#A473FF]/[0.06]",
                  invalid && !selected && "bg-amber-50/40 dark:bg-amber-950/10"
                )}
              >
                {invalid && (
                  <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-amber-400" aria-hidden />
                )}
                <span
                  className={cn(
                    "relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.status === "success"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                      : item.status === "error"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                        : "bg-gray-50 text-gray-400 dark:bg-zinc-800"
                  )}
                >
                  {item.status === "uploading" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : item.status === "success" ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : item.status === "error" ? (
                    <AlertCircle size={14} />
                  ) : (
                    <Music2 size={14} strokeWidth={1.8} />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
                    {item.title.trim() || item.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-400">
                    {formatUploadFileSize(item.size)}
                    {item.status === "uploading" ? ` · ${item.progress}%` : ""}
                    {item.error ? ` · ${item.error}` : ""}
                    {invalid && missingCount > 0
                      ? ` · ${missingCount} required field${missingCount === 1 ? "" : "s"} missing`
                      : ""}
                  </span>
                  {item.status === "uploading" && (
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[#A473FF]/10">
                      <span
                        className="block h-full bg-[#A473FF] transition-[width] duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </span>
                  )}
                </span>

                {item.status !== "uploading" && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(item.id);
                      }
                    }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={14} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
