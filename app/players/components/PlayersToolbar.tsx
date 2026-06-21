"use client";

import React, { useRef } from "react";
import {
  AlertTriangle,
  Radio,
  Clock3,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  dashboardMutedSurface,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import {
  workspaceSelectorOptions,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";
import { cn } from "@/utils/cn";
import type { PlayerStatusFilter } from "../lib/player-status";

export type PlayerSortKey =
  | "updated-desc"
  | "created-desc"
  | "name-asc"
  | "name-desc"
  | "status"
  | "playing";

const STATUS_OPTIONS: {
  value: PlayerStatusFilter;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "all", label: "All", icon: Radio },
  { value: "online", label: "Online", icon: Wifi },
  { value: "offline", label: "Offline", icon: WifiOff },
  { value: "idle", label: "Idle", icon: Clock3 },
  { value: "attention", label: "Attention", icon: AlertTriangle },
];

const SORT_OPTIONS: { value: PlayerSortKey; label: string }[] = [
  { value: "updated-desc", label: "Recently updated" },
  { value: "created-desc", label: "Recently created" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "status", label: "By status" },
  { value: "playing", label: "Now playing" },
];

interface PlayersToolbarProps {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: PlayerStatusFilter;
  setStatusFilter: (value: PlayerStatusFilter) => void;
  sort: PlayerSortKey;
  setSort: (value: PlayerSortKey) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  hasActiveFilters?: boolean;
  showSearch?: boolean;
  showWorkspaceSelector?: boolean;
  workspaceClients?: WorkspaceClientOption[];
  selectedWorkspaceClientId?: string;
  onChangeWorkspaceClient?: (clientId: string) => void;
}

export function PlayersSearch({
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
        aria-label="Search players"
        placeholder="Search players…"
        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {query ? (
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
      ) : null}
    </div>
  );
}

export default function PlayersToolbar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  onClearFilters,
  onRefresh,
  refreshing = false,
  hasActiveFilters: hasActiveFiltersProp,
  showSearch = false,
  showWorkspaceSelector = false,
  workspaceClients = [],
  selectedWorkspaceClientId = "",
  onChangeWorkspaceClient,
}: PlayersToolbarProps) {
  const hasActiveFilters =
    hasActiveFiltersProp ?? (statusFilter !== "all" || query.trim().length > 0);
  const selectorOptions = workspaceSelectorOptions(workspaceClients);

  const controlSelectClass =
    "h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white py-0 pl-9 pr-8 text-sm text-gray-700 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("mr-0.5", dashboardSectionLabel)}>Show</span>
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              disabled={refreshing}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === opt.value
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

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            disabled={refreshing}
            className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-[#8B5CF6] disabled:opacity-50 dark:hover:text-[#A473FF]"
          >
            <X size={12} />
            Reset
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showSearch ? (
          <PlayersSearch query={query} setQuery={setQuery} className="min-w-[200px] flex-1 sm:max-w-xs" />
        ) : null}

        {showWorkspaceSelector ? (
          <div className="relative min-w-[180px] flex-1 sm:max-w-[220px] sm:flex-none">
            <Users
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              id="players-workspace-client"
              value={selectedWorkspaceClientId}
              onChange={(e) => onChangeWorkspaceClient?.(e.target.value)}
              disabled={refreshing}
              aria-label="Workspace"
              className={controlSelectClass}
            >
              {selectorOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="relative min-w-[160px] flex-1 sm:min-w-[180px] sm:flex-none">
          <SlidersHorizontal
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={sort}
            disabled={refreshing}
            onChange={(e) => setSort(e.target.value as PlayerSortKey)}
            aria-label="Sort players"
            className={controlSelectClass}
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
          aria-label={refreshing ? "Refreshing players" : "Refresh players"}
          title="Refresh players"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-[#A473FF]"
        >
          <RefreshCw
            size={16}
            strokeWidth={2}
            className={cn(refreshing && "animate-spin text-[#8B5CF6] dark:text-[#A473FF]")}
          />
        </button>
      </div>
    </div>
  );
}

interface PlayersResultsSummaryProps {
  page: number;
  perPage: number;
  filteredCount: number;
  totalCount: number;
  displayedCount: number;
  hasActiveFilters: boolean;
}

export function PlayersResultsSummary({
  page,
  perPage,
  filteredCount,
  totalCount,
  displayedCount,
  hasActiveFilters,
}: PlayersResultsSummaryProps) {
  if (filteredCount === 0) return null;

  const rangeStart = (page - 1) * perPage + 1;
  const rangeEnd = Math.min(rangeStart + Math.max(displayedCount, 1) - 1, filteredCount);
  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-sm text-gray-500 dark:text-zinc-400">
      <p>
        Showing{" "}
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {filteredCount}
        </span>{" "}
        {filteredCount === 1 ? "player" : "players"}
      </p>
      {isFiltered ? (
        <span className="text-xs text-gray-400">· {totalCount} total in fleet</span>
      ) : null}
    </div>
  );
}
