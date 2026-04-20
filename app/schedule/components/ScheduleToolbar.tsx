"use client";
import React from "react";
import { Search } from "lucide-react";

export default function ScheduleToolbar({
  query,
  onQueryChange,
  selectedRoom,
  onChangeRoom,
  selectedDay,
  onChangeDay,
  rooms,
  days,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  selectedRoom: string | "all";
  onChangeRoom: (r: string | "all") => void;
  selectedDay: string | "all";
  onChangeDay: (d: string | "all") => void;
  rooms: { id: string; name: string }[];
  days: { short: string; full: string }[];
}) {
  return (
    <div className="flex-shrink-0 border-b border-gray-200 p-2.5 flex items-center justify-between bg-white z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
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
          onChange={(e) => onChangeRoom(e.target.value as string)}
          className="text-sm px-3 py-1.5 rounded-md bg-gray-50 border border-transparent"
        >
          <option value="all">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <select
          value={selectedDay}
          onChange={(e) => onChangeDay(e.target.value as string)}
          className="text-sm px-3 py-1.5 rounded-md bg-gray-50 border border-transparent"
        >
          <option value="all">All Days</option>
          {days.map((d) => (
            <option key={d.short} value={d.short}>{d.full}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
