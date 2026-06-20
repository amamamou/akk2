"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface PlaylistsPaginationProps {
  page: number;
  setPage: (n: number) => void;
  perPage: number;
  setPerPage: (n: number) => void;
  perPageOptions: number[];
  totalPages: number;
  disabled?: boolean;
}

export default function PlaylistsPagination({
  page,
  setPage,
  perPage,
  setPerPage,
  perPageOptions,
  totalPages,
  disabled = false,
}: PlaylistsPaginationProps) {
  const atFirst = page <= 1;
  const atLast = page >= totalPages;

  return (
    <nav
      aria-label="Playlist pagination"
      className="flex min-h-[52px] flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800 sm:flex-row"
    >
      <label
        className={cn(
          "flex items-center gap-2 text-xs text-gray-500",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <span>Rows per page</span>
        <select
          value={perPage}
          disabled={disabled}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {perPageOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={disabled || atFirst}
          aria-label="Previous page"
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
            (disabled || atFirst) && "cursor-not-allowed opacity-40"
          )}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="min-w-[5.5rem] px-2 text-center text-sm tabular-nums text-gray-600 dark:text-zinc-400">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={disabled || atLast}
          aria-label="Next page"
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
            (disabled || atLast) && "cursor-not-allowed opacity-40"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
