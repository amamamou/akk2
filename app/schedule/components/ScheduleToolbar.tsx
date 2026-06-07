"use client";
import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ScheduleViewMode } from "@/lib/schedule-calendar";

const VIEW_OPTIONS: { mode: ScheduleViewMode; label: string }[] = [
  { mode: "week", label: "Week View" },
  { mode: "month", label: "Month View" },
  { mode: "hour", label: "Hour View" },
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
  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white z-30">
      {showWorkspaceSelector && (
        <div className="px-2.5 pt-2.5 pb-2 border-b border-gray-100 flex items-center gap-2">
          <label
            htmlFor="schedule-workspace-client"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0"
          >
            Select Client Workspace
          </label>
          <select
            id="schedule-workspace-client"
            value={selectedWorkspaceClientId || ""}
            onChange={(e) => onChangeWorkspaceClient?.(e.target.value)}
            className="flex-1 max-w-md text-sm px-3 py-1.5 rounded-md bg-violet-50 border border-violet-100 text-gray-900"
          >
            {(workspaceClients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="px-2.5 pt-2 border-b border-gray-100">
        <div
          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
          role="group"
          aria-label="Schedule view mode"
        >
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => onChangeViewMode(opt.mode)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                viewMode === opt.mode
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === "month"
              ? "Monthly Schedule"
              : viewMode === "hour"
                ? "Hourly Schedule"
                : "Weekly Schedule"}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              aria-label="Search schedule"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search audio title..."
              className="pl-9 pr-3 py-1 text-sm rounded-md w-56 bg-gray-50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRoom}
            onChange={(e) => onChangeRoom(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-50 border border-transparent"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => onChangeDay(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-50 border border-transparent"
          >
            <option value="all">All Days</option>
            {days.map((d) => (
              <option key={d.short} value={d.short}>
                {d.full} ({d.date})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}