"use client";

import React, { useRef } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Clock3,
  Hash,
  Layers,
  ListMusic,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  dashboardMutedSurface,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export type PlaylistSortKey =
  | "updated-desc"
  | "created-desc"
  | "name-asc"
  | "name-desc"
  | "tracks-desc"
  | "tracks-asc";

export type PlaylistFilterKey = "all" | "has-tracks" | "empty";

const SORT_OPTIONS: {
  value: PlaylistSortKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "updated-desc", label: "Recently updated", icon: Clock3 },
  { value: "created-desc", label: "Recently created", icon: Clock3 },
  { value: "name-asc", label: "A–Z", icon: ArrowDownAZ },
  { value: "name-desc", label: "Z–A", icon: ArrowUpAZ },
  { value: "tracks-desc", label: "Most tracks", icon: Hash },
  { value: "tracks-asc", label: "Least tracks", icon: Hash },
];

const FILTER_OPTIONS: {
  value: PlaylistFilterKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "all", label: "All", icon: ListMusic },
  { value: "has-tracks", label: "Has tracks", icon: Layers },
  { value: "empty", label: "Empty", icon: Hash },
];

interface PlaylistsToolbarProps {
  query: string;
  setQuery: (value: string) => void;
  sort: PlaylistSortKey;
  setSort: (value: PlaylistSortKey) => void;
  filter: PlaylistFilterKey;
  setFilter: (value: PlaylistFilterKey) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  /** When true, renders the search field (hero embeds it when false). */
  showSearch?: boolean;
}

export function PlaylistsSearch({
  query,
  setQuery,
  className,
}: {
  query: string;
  setQuery: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        size={15}
        strokeWidth={1.9}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search playlists"
        placeholder="Search playlists…"
        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function PlaylistsToolbar({
  query,
  setQuery,
  sort,
  setSort,
  filter,
  setFilter,
  onClearFilters,
  onRefresh,
  refreshing = false,
  showSearch = false,
}: PlaylistsToolbarProps) {
  const hasActiveFilters = filter !== "all" || query.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("mr-0.5", dashboardSectionLabel)}>Show</span>
          {FILTER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                disabled={refreshing}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === opt.value
                    ? "bg-[#A473FF]/10 text-[#7C3AED] ring-1 ring-[#A473FF]/20 dark:text-[#A473FF]"
                    : cn(
                        dashboardMutedSurface,
                        "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                      ),
                  refreshing && "pointer-events-none opacity-60"
                )}
              >
                <Icon size={12} strokeWidth={2} className="opacity-70" />
                {opt.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={refreshing}
              className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-[#8B5CF6] disabled:opacity-50 dark:hover:text-[#A473FF]"
            >
              <X size={12} />
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <PlaylistsSearch query={query} setQuery={setQuery} className="sm:max-w-xs" />
          )}

          <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[180px]">
            <SlidersHorizontal
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={sort}
              disabled={refreshing}
              onChange={(e) => setSort(e.target.value as PlaylistSortKey)}
              aria-label="Sort playlists"
              className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white py-0 pl-9 pr-8 text-sm text-gray-700 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label={refreshing ? "Refreshing playlists" : "Refresh playlists"}
            title="Refresh playlists"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-[#A473FF]"
            )}
          >
            <RefreshCw
              size={16}
              strokeWidth={2}
              className={cn(refreshing && "animate-spin text-[#8B5CF6] dark:text-[#A473FF]")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

interface PlaylistsResultsSummaryProps {
  page: number;
  perPage: number;
  filteredCount: number;
  totalCount: number;
  displayedCount: number;
  hasActiveFilters: boolean;
}

export function PlaylistsResultsSummary({
  page,
  perPage,
  filteredCount,
  totalCount,
  displayedCount,
  hasActiveFilters,
}: PlaylistsResultsSummaryProps) {
  if (filteredCount === 0) return null;

  const rangeStart = (page - 1) * perPage + 1;
  const rangeEnd = rangeStart + displayedCount - 1;
  const isPaginated = filteredCount > perPage;
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  let primary: React.ReactNode;

  if (isPaginated) {
    primary = (
      <>
        Showing{" "}
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {filteredCount}
        </span>{" "}
        {filteredCount === 1 ? "playlist" : "playlists"}
      </>
    );
  } else if (isFiltered) {
    primary = (
      <>
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {filteredCount}
        </span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {totalCount}
        </span>{" "}
        {totalCount === 1 ? "playlist" : "playlists"} match your filters
      </>
    );
  } else {
    primary = (
      <>
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {totalCount}
        </span>{" "}
        {totalCount === 1 ? "playlist" : "playlists"}
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-sm text-gray-500 dark:text-zinc-400">
      <ListMusic size={14} strokeWidth={2} className="shrink-0 text-gray-400" />
      <p>{primary}</p>
      {isPaginated && isFiltered && (
        <span className="text-xs text-gray-400">
          · {totalCount} total in library
        </span>
      )}
    </div>
  );
}
