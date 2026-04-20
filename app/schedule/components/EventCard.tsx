"use client";
import React from "react";
import { Trash } from "lucide-react";

type ScheduleEvent = { id: string; audioId: string; title: string; duration: number; roomId: string; day: string; time: string; status?: string };

export default function EventCard({ evt, compact = false, onDelete }: {
  evt: ScheduleEvent;
  compact?: boolean;
  onDelete?: (e: ScheduleEvent) => void;
}) {
  const statusLeft = evt.status === "playing" ? "border-l-4 border-green-400 pl-2" : evt.status === "error" ? "border-l-4 border-red-400 pl-2" : "";

  return (
    <div
      className={`relative flex items-center justify-between bg-gray-50 border border-transparent rounded-md px-3 py-2 transition duration-150 cursor-default group hover:bg-gray-100 ${statusLeft}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <h4 className={`font-semibold text-gray-900 ${compact ? "text-sm" : "text-sm"} whitespace-normal break-words`}>{evt.title}</h4>
          <span className="text-xs text-gray-500 mt-1">{evt.duration}m</span>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400">
        <button
          onClick={(ev) => { ev.stopPropagation(); onDelete?.(evt); }}
          className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}
