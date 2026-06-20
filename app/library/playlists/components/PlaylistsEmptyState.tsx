"use client";

import React from "react";
import { ListMusic, Plus, RotateCcw, Search } from "lucide-react";
import {
  dashboardAccentDot,
  dashboardCardClass,
  dashboardIconChip,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

interface PlaylistsEmptyStateProps {
  variant: "no-playlists" | "no-results";
  onCreateClick: () => void;
  onClearFilters?: () => void;
}

export default function PlaylistsEmptyState({
  variant,
  onCreateClick,
  onClearFilters,
}: PlaylistsEmptyStateProps) {
  const isSearch = variant === "no-results";

  return (
    <div
      className={cn(
        dashboardCardClass,
        "flex flex-col items-center justify-center px-6 py-20 text-center"
      )}
    >
      <div className={cn(dashboardIconChip, "mb-6 h-16 w-16 rounded-2xl")}>
        {isSearch ? (
          <Search size={24} strokeWidth={1.8} className="text-[#8B5CF6]" />
        ) : (
          <ListMusic size={24} strokeWidth={1.8} className="text-[#8B5CF6]" />
        )}
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-zinc-100">
        {isSearch ? "No matching playlists" : "Start your first playlist"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
        {isSearch
          ? "Nothing matches your current search or filters. Try broadening your criteria or reset to see everything."
          : "Playlists group tracks into programs you can schedule and broadcast. Create one to begin building your audio library."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {isSearch && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={15} strokeWidth={2} />
            Reset filters
          </button>
        ) : null}

        {!isSearch && (
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(164,115,255,0.28)] transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Create playlist
          </button>
        )}
      </div>

      {!isSearch && (
        <p className="mt-8 flex items-center gap-1.5 text-xs text-gray-400">
          <span className={dashboardAccentDot} aria-hidden />
          Used in schedules and live broadcasts
        </p>
      )}
    </div>
  );
}
