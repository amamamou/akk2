"use client";
import React from "react";
import { useDrop } from "react-dnd";
import { Plus } from "lucide-react";
import { cn } from "../../../utils/cn";
import EventCard from "./EventCard";

type AudioItem = { id: string; title: string; duration: number; type: string };
type ScheduleEvent = { id: string; audioId: string; title: string; duration: number; roomId: string; day: string; time: string };
const ITEM_TYPES = { AUDIO: "audio" };

export default function CalendarCell({
  roomId,
  day,
  time,
  events,
  onDropEvent,
  onEventClick,
  onEventDelete,
  compact,
}: {
  roomId: string;
  day: string;
  time: string;
  events: ScheduleEvent[];
  onDropEvent: (item: AudioItem, roomId: string, day: string, time: string) => void;
  onEventClick?: (evt: ScheduleEvent) => void;
  onEventDelete?: (evt: ScheduleEvent) => void;
  compact?: boolean;
}) {
	// When dropping into this cell, use the cell's own time slot so
	// broadcasts line up visually with the grid.
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ITEM_TYPES.AUDIO,
    drop: (item: AudioItem) => onDropEvent(item, roomId, day, time),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div
      ref={(el) => (dropRef as unknown as (instance: HTMLDivElement | null) => void)(el)}
      role="list"
      aria-label={`Schedule cell ${day} ${time} for room ${roomId}`}
  className={cn("group relative min-h-[72px] p-3 transition-all bg-white overflow-visible")}
    >
      {isOver && (
        <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-gray-300 bg-white/60 animate-fade z-40" />
      )}

      {/* Empty state: subtle + affordance */}
      {/* Empty state: quiet by default, show + on hover */}
      {events.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <button aria-label="Quick create" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white border border-gray-100 text-gray-400 hover:bg-gray-50">
            <Plus size={14} />
          </button>
        </div>
      )}

      {/* Events list */}
      <div className="space-y-1">
        {events.map((evt) => (
          <div key={evt.id} role="listitem">
            <EventCard evt={evt} compact={compact}  onDelete={(e) => onEventDelete?.(e)} />
          </div>
        ))}
      </div>
    </div>
  );
}
