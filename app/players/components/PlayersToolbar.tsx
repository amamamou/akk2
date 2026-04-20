"use client";

import React from "react";
import { Search, Speaker, SlidersHorizontal } from "lucide-react";

type StatusFilter = "all" | "online" | "offline" | "idle";

export default function PlayersToolbar({
  query,
  onQueryChange,
  statusFilter,
  onChangeStatus,
  totalCount,
  filteredCount,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  statusFilter: StatusFilter;
  onChangeStatus: (s: StatusFilter) => void;
  totalCount: number;
  filteredCount: number;
}) {
  const showingAll = totalCount === filteredCount;

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        {/* Left: Search */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="relative w-full max-w-md" role="search">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              aria-label="Search players"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by room, player, track..."
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />

            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              >
                <span className="text-xs font-medium">×</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Count + Filters */}
        <div className="flex items-center gap-3 md:gap-4 justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <Speaker size={14} className="text-gray-400" />
            {totalCount === 0 ? (
              <span>No players</span>
            ) : showingAll ? (
              <span>
                Showing all {totalCount} {totalCount === 1 ? "player" : "players"}
              </span>
            ) : (
              <span>
                Showing {filteredCount} of {totalCount} players
              </span>
            )}
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) =>
                onChangeStatus(e.target.value as StatusFilter)
              }
              className="text-sm pl-8 pr-3 py-1.5 rounded-md bg-gray-50 border border-transparent text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="idle">Idle</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
