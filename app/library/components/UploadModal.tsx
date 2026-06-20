"use client";

import React from "react";
import { X } from "lucide-react";
import UploadAudioWorkspace from "@/app/library/audio/upload/UploadAudioWorkspace";
import { dashboardCardClass } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function UploadModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload?: (count: number) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8">
      <div
        className={cn(
          dashboardCardClass,
          "relative my-4 w-full max-w-5xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <h2 className="text-base font-semibold text-gray-950 dark:text-zinc-100">Upload audio</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-6 sm:px-6">
          <UploadAudioWorkspace
            variant="modal"
            onCancel={onClose}
            onComplete={(count) => {
              onUpload?.(count);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
