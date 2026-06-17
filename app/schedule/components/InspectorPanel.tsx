"use client";

import React from "react";
import type { ScheduleEventCard } from "./EventCard";

export default function InspectorPanel({
  event,
  open,
  rooms = [],
  saving = false,
  onClose,
  onChange,
  onSave,
}: {
  event: ScheduleEventCard | null;
  open: boolean;
  rooms?: { id: string; name: string }[];
  saving?: boolean;
  onClose: () => void;
  onChange: (patch: Partial<ScheduleEventCard>) => void;
  onSave: () => void;
}) {
  if (!open || !event) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <aside className="w-96 bg-white z-50 p-6 fixed right-4 top-20 bottom-4 overflow-auto rounded-md shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Event Details</h3>
          <button type="button" onClick={onClose} className="text-sm text-gray-500">
            Close
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-500">Title</label>
            <input
              value={event.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Time (HH:mm)</label>
            <input
              value={event.time}
              onChange={(e) => onChange({ time: e.target.value })}
              placeholder="09:00"
              className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Duration (min)</label>
            <input
              type="number"
              min={1}
              value={event.duration}
              onChange={(e) => onChange({ duration: Number(e.target.value) })}
              className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Room / Player</label>
            {rooms.length > 0 ? (
              <select
                value={event.roomId}
                onChange={(e) => onChange({ roomId: e.target.value })}
                className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={event.roomId}
                onChange={(e) => onChange({ roomId: e.target.value })}
                className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              />
            )}
          </div>

          {event.tenantLabel ? (
            <div>
              <label className="text-sm font-medium text-gray-500">Client</label>
              <p className="mt-2 text-sm text-gray-700">{event.tenantLabel}</p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="w-full rounded-md bg-[#A473FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f5cf0] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </aside>
    </>
  );
}
