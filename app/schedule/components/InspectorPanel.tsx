"use client";
import React from "react";

type ScheduleEvent = { id: string; audioId: string; title: string; duration: number; roomId: string; day: string; time: string };

export default function InspectorPanel({
  event,
  open,
  onClose,
  onChange,
}: {
  event: ScheduleEvent | null;
  open: boolean;
  onClose: () => void;
  onChange: (patch: Partial<ScheduleEvent>) => void;
}) {
  if (!open || !event) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <aside className="w-96 bg-white z-50 p-6 fixed right-4 top-20 bottom-4 overflow-auto rounded-md shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Event Details</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-500">Title</label>
            <input value={event.title} onChange={(e) => onChange({ title: e.target.value })} className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Time</label>
            <input value={event.time} onChange={(e) => onChange({ time: e.target.value })} className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Duration (min)</label>
            <input type="number" value={event.duration} onChange={(e) => onChange({ duration: Number(e.target.value) })} className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Room</label>
            <input value={event.roomId} onChange={(e) => onChange({ roomId: e.target.value })} className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Repeat</label>
            <select className="w-full mt-2 p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300">
              <option>Never</option>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>
        </div>
      </aside>
    </>
  );
}
