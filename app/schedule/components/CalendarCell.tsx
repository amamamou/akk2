"use client";
import React from "react";
import { useDrop } from "react-dnd";
import { Plus } from "lucide-react";
import { cn } from "../../../utils/cn";
import EventCard, { type ScheduleEventCard } from "./EventCard";

type AudioItem = { id: string; title: string; duration: number; type: string };
type PlaylistDrop = {
  playlistId: string;
  title: string;
  trackCount: number;
  totalDuration: string;
};

const ITEM_TYPES = { AUDIO: "audio", PLAYLIST: "playlist" };

export default function CalendarCell({
  roomId,
  day,
  time,
  calendarDate,
  events,
  onDropEvent,
  onDropPlaylist,
  onEventDelete,
  compact,
  onQuickCreate,
}: {
  roomId: string;
  day: string;
  time: string;
  calendarDate?: string;
  events: ScheduleEventCard[];
  onDropEvent: (
    item: AudioItem,
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string
  ) => void;
  onDropPlaylist?: (
    item: PlaylistDrop,
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string
  ) => void;
  onEventDelete?: (evt: ScheduleEventCard) => void;
  compact?: boolean;
  onQuickCreate?: (
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string
  ) => void;
}) {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: [ITEM_TYPES.AUDIO, ITEM_TYPES.PLAYLIST],
    drop: (item: AudioItem | PlaylistDrop) => {
      const maybe = item as PlaylistDrop;
      if (
        maybe &&
        typeof maybe.trackCount === "number" &&
        typeof maybe.playlistId === "string"
      ) {
        onDropPlaylist?.(maybe, roomId, day, time, calendarDate);
        return;
      }
      onDropEvent(item as AudioItem, roomId, day, time, calendarDate);
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  const isEmpty = events.length === 0;

  return (
    <div
      ref={(el) => (dropRef as unknown as (instance: HTMLDivElement | null) => void)(el)}
      role="list"
      aria-label={`Schedule cell ${day} ${time} for room ${roomId}`}
      className={cn(
        "group relative min-h-[88px] p-3 transition-all bg-white overflow-visible border-r border-gray-100 last:border-r-0",
        isEmpty && "flex flex-col"
      )}
    >
      {isOver && (
        <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-[#A473FF] bg-purple-50/40 z-40" />
      )}

      {isEmpty ? (
        <button
          type="button"
          aria-label="Add item"
          onClick={() => onQuickCreate?.(roomId, day, time, calendarDate)}
          className="flex-1 min-h-[64px] w-full flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:border-[#A473FF]/50 hover:text-[#A473FF] hover:bg-purple-50/30 transition-colors"
        >
          <Plus size={20} strokeWidth={1.5} />
        </button>
      ) : (
        <div className="space-y-1">
          {events.map((evt) => (
            <div key={evt.id} role="listitem">
              <EventCard evt={evt} compact={compact} onDelete={onEventDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
