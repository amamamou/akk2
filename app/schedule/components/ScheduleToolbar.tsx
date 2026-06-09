"use client";

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  CalendarDays,
  CalendarRange,
  Clock3,
  Building2,
  RotateCcw,
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
  onChangeWorkspaceClient,
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
  onChangeWorkspaceClient?: (clientId: string) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

return (
  <div className="sticky top-0 z-10 bg-white">
    {/* Header */}
    <div className="px-8 py-6">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {viewMode === "month"
              ? "Monthly Schedule"
              : viewMode === "hour"
              ? "Hourly Schedule"
              : "Weekly Schedule"}
          </h1>
  <div>            </div>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === "month"
              ? "Calendar month view"
              : viewMode === "hour"
              ? "Hour-by-hour schedule view"
              : "Overview of the current week"}
          </p>
        </div>

        {/* View Modes */}
        <div className="hidden lg:flex items-center gap-1 rounded-2xl bg-zinc-100 p-1">
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
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <Icon size={15} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>


    {/* Premium Toolbar */}
    <div className="px-8 py-6">
      <div
        className="
          flex
          flex-wrap
          items-center
          gap-6
          rounded-2xl
          
          border-zinc-200
          
        "
      >
        {/* Workspace */}
        {showWorkspaceSelector && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-500">
              Workspace
            </span>

            <select
              id="schedule-workspace-client"
              value={selectedWorkspaceClientId || ""}
              onChange={(e) =>
                onChangeWorkspaceClient?.(e.target.value)
              }
              className="
                bg-transparent
                border-0
                text-sm
                font-medium
                text-zinc-900
                focus:outline-none
                cursor-pointer
              "
            >
              {(workspaceClients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="h-5 w-px bg-zinc-200" />

        {/* Filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
            showFilters
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          )}
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>

        {showFilters && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">
                Room
              </span>

              <select
                id="schedule-room"
                value={selectedRoom}
                onChange={(e) => onChangeRoom(e.target.value)}
                className="
                  bg-transparent
                  border-0
                  text-sm
                  font-medium
                  text-zinc-900
                  focus:outline-none
                "
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
              <span className="text-xs text-zinc-400">
                Day
              </span>

              <select
                id="schedule-day"
                value={selectedDay}
                onChange={(e) => onChangeDay(e.target.value)}
                className="
                  bg-transparent
                  border-0
                  text-sm
                  font-medium
                  text-zinc-900
                  focus:outline-none
                "
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
              onClick={() => {
                onQueryChange("");
                onChangeRoom("all");
                onChangeDay("all");
              }}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                px-3
                py-2
                text-sm
                font-medium
                text-zinc-500
                hover:bg-white
                hover:text-zinc-900
                transition-all
              "
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