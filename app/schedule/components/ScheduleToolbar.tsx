"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  CalendarDays,
  CalendarRange,
  Calendar,
  Clock3,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleViewMode } from "@/lib/schedule-calendar";

const VIEW_OPTIONS = [
  {
    mode: "week" as ScheduleViewMode,
    label: "Week",
    icon: CalendarDays,
  },
  {
    mode: "day" as ScheduleViewMode,
    label: "Day",
    icon: Calendar,
  },
  {
    mode: "month" as ScheduleViewMode,
    label: "Month",
    icon: CalendarRange,
  },
  {
    mode: "hour" as ScheduleViewMode,
    label: "Hour",
    icon: Clock3,
  },
];

const SELECT_CLASS =
  "rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-200 shadow-sm focus:border-[#A473FF] focus:outline-none focus:ring-2 focus:ring-[#A473FF]/20";

export default function ScheduleToolbar({
  query,
  onQueryChange,
  selectedRoom,
  onChangeRoom,
  selectedDay,
  onChangeDay,
  viewMode,
  onChangeViewMode,
  rooms,
  days,
  showWorkspaceSelector,
  workspaceClients,
  selectedWorkspaceClientId,
  activeWorkspaceClientName,
  onChangeWorkspaceClient,
  calendarPeriodLabel,
  onPrevPeriod,
  onNextPeriod,
  onToday,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  selectedRoom: string;
  onChangeRoom: (r: string) => void;
  selectedDay: string;
  onChangeDay: (d: string) => void;
  viewMode: ScheduleViewMode;
  onChangeViewMode: (mode: ScheduleViewMode) => void;
  rooms: { id: string; name: string }[];
  days: { short: string; full: string; date?: string }[];
  showWorkspaceSelector?: boolean;
  workspaceClients?: { id: string; name: string; tenantId: string }[];
  selectedWorkspaceClientId?: string;
  activeWorkspaceClientName?: string;
  onChangeWorkspaceClient?: (clientId: string) => void;
  calendarPeriodLabel?: string;
  onPrevPeriod?: () => void;
  onNextPeriod?: () => void;
  onToday?: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="px-8 py-6">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {viewMode === "month"
                ? "Monthly Schedule"
                : viewMode === "hour"
                  ? "Hourly Schedule"
                  : viewMode === "day"
                    ? "Daily Schedule"
                    : "Weekly Schedule"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              {viewMode === "month"
                ? "Calendar month view"
                : viewMode === "hour"
                  ? "Hour-by-hour schedule view"
                  : viewMode === "day"
                    ? "24-hour vertical day agenda"
                    : "Overview of the current week"}
            </p>
            {calendarPeriodLabel ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous period"
                  onClick={onPrevPeriod}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[10rem] text-center text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {calendarPeriodLabel}
                </span>
                <button
                  type="button"
                  aria-label="Next period"
                  onClick={onNextPeriod}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <ChevronRight size={16} />
                </button>
                {onToday ? (
                  <button
                    type="button"
                    onClick={onToday}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Today
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* View Modes — desktop */}
          <div className="hidden lg:flex items-center gap-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 p-1">
            {VIEW_OPTIONS.map((opt) => {
              const Icon = opt.icon;

              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => onChangeViewMode(opt.mode)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    viewMode === opt.mode
                      ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  <Icon size={15} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* View Modes — mobile */}
          <div className="flex lg:hidden shrink-0">
            <label className="sr-only" htmlFor="schedule-view-mode-mobile">
              Schedule view
            </label>
            <select
              id="schedule-view-mode-mobile"
              value={viewMode}
              onChange={(e) => onChangeViewMode(e.target.value as ScheduleViewMode)}
              className={cn(SELECT_CLASS, "min-w-[9.5rem] appearance-none pr-8")}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.65rem center",
              }}
            >
              {VIEW_OPTIONS.map((opt) => (
                <option key={opt.mode} value={opt.mode}>
                  {opt.label} view
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Premium Toolbar */}
      <div className="px-8 pb-6">
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50/50 dark:bg-zinc-800/50 px-5 py-4">
          {/* Workspace */}
          {showWorkspaceSelector && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Client workspace
                </span>

                <select
                  id="schedule-workspace-client"
                  aria-label="Select client workspace"
                  value={selectedWorkspaceClientId || ""}
                  onChange={(e) => onChangeWorkspaceClient?.(e.target.value)}
                  className={cn(SELECT_CLASS, "min-w-[12rem] cursor-pointer")}
                >
                  {(workspaceClients ?? []).length === 0 ? (
                    <option value="" disabled>
                      Loading workspaces…
                    </option>
                  ) : (
                    <>
                      {!selectedWorkspaceClientId && (
                        <option value="" disabled>
                          Select client workspace…
                        </option>
                      )}
                      {(workspaceClients ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              {activeWorkspaceClientName && selectedWorkspaceClientId ? (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-400 pl-[calc(7.5rem+0.75rem)]">
                  Viewing schedule for {activeWorkspaceClientName}
                </span>
              ) : null}
            </div>
          )}

          {showWorkspaceSelector ? (
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
          ) : null}

          {/* Filters */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              showFilters
                ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-600"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/80 dark:hover:bg-zinc-800"
            )}
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>

          {showFilters && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-400">Room</span>

                <select
                  id="schedule-room"
                  value={
                    selectedRoom === "all" || rooms.some((r) => r.id === selectedRoom)
                      ? selectedRoom
                      : "all"
                  }
                  onChange={(e) => onChangeRoom(e.target.value)}
                  className={cn(SELECT_CLASS, "py-1.5")}
                >
                  <option value="all">All Rooms</option>

                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-400">Day</span>

                <select
                  id="schedule-day"
                  value={selectedDay}
                  onChange={(e) => onChangeDay(e.target.value)}
                  className={cn(SELECT_CLASS, "py-1.5")}
                >
                  <option value="all">All Days</option>

                  {days.map((d) => (
                    <option key={d.short} value={d.short}>
                      {d.full}
                      {d.date && ` (${d.date})`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  onQueryChange("");
                  onChangeRoom("all");
                  onChangeDay("all");
                }}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
