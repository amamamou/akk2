"use client";

import React from "react";
import { Play } from "lucide-react";
import { cn } from "@/utils/cn";

export default function TrackPlayButton({
  isPreviewing,
  hasError,
  onClick,
}: {
  isPreviewing?: boolean;
  hasError?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPreviewing && !hasError}
      aria-label={
        hasError ? "Preview unavailable" : isPreviewing ? "Active preview" : "Preview track"
      }
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
        "text-gray-400 hover:bg-[#A473FF]/8 hover:text-[#8B5CF6]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A473FF]/30 focus-visible:ring-offset-1",
        "disabled:cursor-default disabled:text-[#8B5CF6] disabled:opacity-100 disabled:hover:bg-transparent dark:disabled:text-[#A473FF]",
        "dark:hover:bg-[#A473FF]/10 dark:hover:text-[#A473FF]",
        hasError && "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
      )}
    >
      <Play size={14} className="ml-0.5" strokeWidth={2} />
    </button>
  );
}
