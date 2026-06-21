"use client";

import React, { useRef } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CircleDot,
  Clock3,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  dashboardMutedSurface,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export type ClientStatusFilter = "all" | "ACTIVE" | "INACTIVE" | "TRIAL";
export type ClientPlanFilter = "all" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
export type ClientSortKey =
  | "name-asc"
  | "name-desc"
  | "outstanding-desc"
  | "created-desc";

const STATUS_OPTIONS: {
  value: ClientStatusFilter;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "all", label: "All", icon: Users },
  { value: "ACTIVE", label: "Active", icon: CircleDot },
  { value: "INACTIVE", label: "Inactive", icon: CircleDot },
  { value: "TRIAL", label: "Trial", icon: CircleDot },
];

const PLAN_OPTIONS: { value: ClientPlanFilter; label: string }[] = [
  { value: "all", label: "All plans" },
  { value: "STARTER", label: "Starter" },
  { value: "PROFESSIONAL", label: "Growth" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const SORT_OPTIONS: {
  value: ClientSortKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "name-asc", label: "Name A–Z", icon: ArrowDownAZ },
  { value: "name-desc", label: "Name Z–A", icon: ArrowUpAZ },
  { value: "outstanding-desc", label: "Outstanding balance", icon: Wallet },
  { value: "created-desc", label: "Recently added", icon: Clock3 },
];

interface ClientsToolbarProps {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: ClientStatusFilter;
  setStatusFilter: (value: ClientStatusFilter) => void;
  planFilter: ClientPlanFilter;
  setPlanFilter: (value: ClientPlanFilter) => void;
  sort: ClientSortKey;
  setSort: (value: ClientSortKey) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  showSearch?: boolean;
}

export function ClientsSearch({
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
        aria-label="Search clients"
        placeholder="Search clients…"
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

export default function ClientsToolbar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  sort,
  setSort,
  onClearFilters,
  onRefresh,
  refreshing = false,
  showSearch = false,
}: ClientsToolbarProps) {
  const hasActiveFilters =
    statusFilter !== "all" ||
    planFilter !== "all" ||
    query.trim().length > 0;

  return (
    <div className="space-y-3">
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
            <ClientsSearch query={query} setQuery={setQuery} className="sm:max-w-xs" />
          ) : null}

          <div className="relative min-w-[140px] flex-1 sm:flex-none sm:min-w-[150px]">
            <select
              value={planFilter}
              disabled={refreshing}
              onChange={(e) => setPlanFilter(e.target.value as ClientPlanFilter)}
              aria-label="Filter by plan"
              className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white py-0 pl-3 pr-8 text-sm text-gray-700 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[180px]">
            <SlidersHorizontal
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={sort}
              disabled={refreshing}
              onChange={(e) => setSort(e.target.value as ClientSortKey)}
              aria-label="Sort clients"
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
            aria-label={refreshing ? "Refreshing clients" : "Refresh clients"}
            title="Refresh clients"
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
    </div>
  );
}

interface ClientsResultsSummaryProps {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
}

export function ClientsResultsSummary({
  filteredCount,
  totalCount,
  hasActiveFilters,
}: ClientsResultsSummaryProps) {
  if (filteredCount === 0) return null;

  const isFiltered = hasActiveFilters && filteredCount !== totalCount;

  let primary: React.ReactNode;

  if (isFiltered) {
    primary = (
      <>
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {filteredCount}
        </span>{" "}
        of{" "}
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {totalCount}
        </span>{" "}
        {totalCount === 1 ? "client" : "clients"} match your filters
      </>
    );
  } else {
    primary = (
      <>
        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
          {totalCount}
        </span>{" "}
        {totalCount === 1 ? "client" : "clients"}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
      <Users size={14} strokeWidth={2} className="shrink-0 text-gray-400" aria-hidden />
      <p>{primary}</p>
    </div>
  );
}
