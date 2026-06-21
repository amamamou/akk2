"use client";

import React from "react";
import { Building2, Plus, Radio, RotateCcw, Search } from "lucide-react";
import {
  dashboardAccentDot,
  dashboardCardClass,
  dashboardIconChip,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

interface PlayersEmptyStateProps {
  variant: "no-players" | "no-results" | "select-workspace" | "no-workspaces";
  onAddClick?: () => void;
  onClearFilters?: () => void;
}

export default function PlayersEmptyState({
  variant,
  onAddClick,
  onClearFilters,
}: PlayersEmptyStateProps) {
  const isSearch = variant === "no-results";
  const isWorkspace = variant === "select-workspace";
  const isNoWorkspaces = variant === "no-workspaces";

  const Icon = isSearch ? Search : isWorkspace || isNoWorkspaces ? Building2 : Radio;

  const title = isSearch
    ? "No matching players"
    : isWorkspace
      ? "Select a workspace"
      : isNoWorkspaces
        ? "No active workspaces"
        : "Add your first player";

  const description = isSearch
    ? "Nothing matches your search or filters. Try broadening your criteria or reset to see the full fleet."
    : isWorkspace
      ? "Choose a client workspace above to view and manage players for that tenant."
      : isNoWorkspaces
        ? "Active client workspaces are required before players can be loaded."
        : "Register audio devices by location to monitor connectivity, playback, and schedule assignments.";

  return (
    <div
      className={cn(
        dashboardCardClass,
        "flex flex-col items-center justify-center px-6 py-20 text-center"
      )}
    >
      <div className={cn(dashboardIconChip, "mb-6 h-16 w-16 rounded-2xl")}>
        <Icon size={24} strokeWidth={1.8} className="text-[#8B5CF6]" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-zinc-100">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
        {description}
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

        {!isSearch && !isWorkspace && !isNoWorkspaces && onAddClick ? (
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(164,115,255,0.28)] transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Add player
          </button>
        ) : null}
      </div>

      {!isSearch && !isWorkspace && !isNoWorkspaces ? (
        <p className="mt-8 flex items-center gap-1.5 text-xs text-gray-400">
          <span className={dashboardAccentDot} aria-hidden />
          Status updates every few seconds when devices are connected
        </p>
      ) : null}
    </div>
  );
}
