"use client";

import React from "react";
import { FileAudio, Upload } from "lucide-react";
import { dashboardCardClass, dashboardIconChip } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function UploadDropzone({
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onBrowse,
  compact = false,
}: {
  dragActive: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowse: () => void;
  compact?: boolean;
}) {
  return (
    <section
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        dashboardCardClass,
        "relative transition-colors",
        compact ? "p-5" : "p-8 sm:p-10",
        dragActive && "border-[#A473FF]/30 bg-[#A473FF]/[0.03] dark:bg-[#A473FF]/[0.06]"
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn(dashboardIconChip, compact ? "mb-4 h-12 w-12" : "mb-6 h-14 w-14")}>
          {dragActive ? (
            <FileAudio size={22} strokeWidth={1.8} className="text-[#8B5CF6]" />
          ) : (
            <Upload size={22} strokeWidth={1.8} className="text-[#8B5CF6]" />
          )}
        </div>

        <h2 className="text-base font-semibold tracking-tight text-gray-950 dark:text-zinc-100">
          {dragActive ? "Drop to import" : "Add audio files"}
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-gray-500 dark:text-zinc-400">
          Drag and drop files here, or{" "}
          <button
            type="button"
            onClick={onBrowse}
            className="font-medium text-[#7C3AED] transition-colors hover:text-[#8B5CF6] dark:text-[#A473FF]"
          >
            browse your device
          </button>
        </p>
        <p className="mt-4 text-xs text-gray-400">MP3, WAV, OGG, M4A · Max 100 MB per file</p>
      </div>
    </section>
  );
}
