"use client";

import React, { useRef } from "react";
import {
  HardDrive,
  Layers,
  ListMusic,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { dashboardSectionLabel } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import type { AudioSizeFilterKey, AudioSortKey } from "../lib/audio-library-utils";

export type AudioCategoryFilter = "all" | string;

const SIZE_OPTIONS: { value: AudioSizeFilterKey; label: string }[] = [
  { value: "all", label: "All sizes" },
  { value: "small", label: "< 5 MB" },
  { value: "medium", label: "5–20 MB" },
  { value: "large", label: "> 20 MB" },
];

const SORT_OPTIONS: { value: AudioSortKey; label: string }[] = [
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "duration-desc", label: "Longest" },
  { value: "duration-asc", label: "Shortest" },
  { value: "size-desc", label: "Largest file" },
  { value: "size-asc", label: "Smallest file" },
];

const filterSelectClass =
  "h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white py-0 pl-9 pr-8 text-sm text-gray-700 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

export function AudioSearch({
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
        aria-label="Search audio"
        placeholder="Search audio…"
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

export function AudioResultsSummary({
  page,
  perPage,
  filteredCount,
  totalCount,
  displayedCount,
  hasActiveFilters,
}: {
  page: number;
  perPage: number;
  filteredCount: number;
  totalCount: number;
  displayedCount: number;
  hasActiveFilters: boolean;
}) {
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
        {filteredCount === 1 ? "file" : "files"}
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
        match your filters
      </>
    );
  } else {
    primary = (
      <>
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {totalCount}
        </span>{" "}
        {totalCount === 1 ? "file" : "files"}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
      <ListMusic size={14} strokeWidth={2} className="shrink-0 text-gray-400" />
      <p>{primary}</p>
      {isPaginated && isFiltered && (
        <span className="text-xs text-gray-400">· {totalCount} total in library</span>
      )}
    </div>
  );
}

export default function AudioToolbar({
  category,
  setCategory,
  categoryOptions,
  sizeFilter,
  setSizeFilter,
  sort,
  setSort,
  onClearFilters,
  onRefresh,
  refreshing = false,
  hasActiveFilters,
}: {
  category: AudioCategoryFilter;
  setCategory: (value: AudioCategoryFilter) => void;
  categoryOptions: string[];
  sizeFilter: AudioSizeFilterKey;
  setSizeFilter: (value: AudioSizeFilterKey) => void;
  sort: AudioSortKey;
  setSort: (value: AudioSortKey) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("mr-0.5", dashboardSectionLabel)}>Category</span>
          <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[180px]">
            <Layers
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={category}
              disabled={refreshing}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className={filterSelectClass}
            >
              <option value="all">All</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <span className={cn("ml-1 mr-0.5", dashboardSectionLabel)}>File size</span>
          <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[180px]">
            <HardDrive
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={sizeFilter}
              disabled={refreshing}
              onChange={(e) => setSizeFilter(e.target.value as AudioSizeFilterKey)}
              aria-label="Filter by file size"
              className={filterSelectClass}
            >
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

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
          <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[180px]">
            <SlidersHorizontal
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={sort}
              disabled={refreshing}
              onChange={(e) => setSort(e.target.value as AudioSortKey)}
              aria-label="Sort audio"
              className={filterSelectClass}
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
            aria-label={refreshing ? "Refreshing audio" : "Refresh audio"}
            title="Refresh audio"
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
