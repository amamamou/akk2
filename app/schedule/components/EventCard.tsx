"use client";
import React from "react";
import { Trash } from "lucide-react";

export type ScheduleEventCard = {
  id: string;
  audioId?: string;
  playlistId?: string;
  title: string;
  duration: number;
  trackCount?: number;
  roomId: string;
  day: string;
  time: string;
  calendarDate?: string;
  status?: string;
  loopPlayback?: boolean;
  /** Set when loaded under All Clients aggregate view. */
  tenantId?: string;
  tenantLabel?: string;
};

export default function EventCard({
  evt,
  compact = false,
  onDelete,
}: {
  evt: ScheduleEventCard;
  compact?: boolean;
  onDelete?: (e: ScheduleEventCard) => void;
}) {
  const isPlaylist = Boolean(evt.playlistId);
  const statusLeft =
    evt.status === "playing"
      ? "border-l-4 border-green-400 pl-2"
      : evt.status === "error"
        ? "border-l-4 border-red-400 pl-2"
        : "";

  return (
    <div
      className={`relative flex items-center justify-between rounded-md px-3 py-2 transition duration-150 cursor-default group ${
        isPlaylist
          ? "bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 hover:from-purple-100 hover:to-indigo-100"
          : "bg-gray-50 border border-transparent hover:bg-gray-100"
      } ${statusLeft}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {isPlaylist && (
              <span className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-600 text-white">
                Playlist
              </span>
            )}
            {evt.loopPlayback && (
              <span className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700">
                Loop
              </span>
            )}
          </div>
          <h4
            className={`font-semibold text-gray-900 ${
              compact ? "text-sm" : "text-sm"
            } whitespace-normal break-words`}
          >
            {evt.title}
          </h4>
          <span className="text-xs text-gray-500">
            {isPlaylist && evt.trackCount != null
              ? `${evt.trackCount} ${evt.trackCount === 1 ? "track" : "tracks"}`
              : `${evt.duration}m`}
          </span>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-gray-400">
        <button
          type="button"
          onClick={(ev) => {
            ev.stopPropagation();
            onDelete?.(evt);
          }}
          className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}