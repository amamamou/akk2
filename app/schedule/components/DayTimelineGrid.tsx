"use client";

import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import EventCard, { type ScheduleEventCard } from "./EventCard";
import {
  DAY_HOUR_HEIGHT_PX,
  DAY_TIMELINE_HOURS,
  computeEventTimelineBounds,
} from "@/lib/schedule-calendar";

export default function DayTimelineGrid({
  rooms,
  events,
  calendarDate,
  dayShort,
  onEventEdit,
  onEventDelete,
  onQuickCreate,
}: {
  rooms: { id: string; name: string }[];
  events: ScheduleEventCard[];
  calendarDate: string;
  dayShort: string;
  onEventEdit?: (e: ScheduleEventCard) => void;
  onEventDelete?: (e: ScheduleEventCard) => void;
  onQuickCreate?: (
    roomId: string,
    day: string,
    time: string,
    calendarDate: string
  ) => void;
}) {
  const timelineHeight = DAY_TIMELINE_HOURS.length * DAY_HOUR_HEIGHT_PX;

  const eventsByRoom = useMemo(() => {
    const map = new Map<string, ScheduleEventCard[]>();
    for (const room of rooms) {
      map.set(
        room.id,
        events.filter((e) => e.roomId === room.id)
      );
    }
    return map;
  }, [rooms, events]);

  const handleColumnClick = (
    e: React.MouseEvent<HTMLDivElement>,
    roomId: string
  ) => {
    if ((e.target as HTMLElement).closest("[data-event-card]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = Math.floor((y / DAY_HOUR_HEIGHT_PX) * 60);
    const clamped = Math.max(0, Math.min(23 * 60 + 45, totalMinutes));
    const h = Math.floor(clamped / 60);
    const m = Math.floor((clamped % 60) / 15) * 15;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onQuickCreate?.(roomId, dayShort, time, calendarDate);
  };

  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <div
        className="grid border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white sticky top-0 z-20"
        style={{
          gridTemplateColumns: `72px repeat(${rooms.length}, minmax(180px, 1fr))`,
        }}
      >
        <div className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-r border-gray-200">
          Time
        </div>
        {rooms.map((room) => (
          <div
            key={room.id}
            className="px-3 py-3 text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0 truncate"
            title={room.name}
          >
            {room.name}
          </div>
        ))}
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `72px repeat(${rooms.length}, minmax(180px, 1fr))`,
        }}
      >
        <div
          className="relative border-r border-gray-200 bg-gray-50/80"
          style={{ height: timelineHeight }}
        >
          {DAY_TIMELINE_HOURS.map((hour, i) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-center px-2 text-[11px] text-gray-400 font-medium tabular-nums border-t border-gray-100/80 first:border-t-0"
              style={{ top: i * DAY_HOUR_HEIGHT_PX, height: DAY_HOUR_HEIGHT_PX }}
            >
              <span className="-mt-[1px]">{hour}</span>
            </div>
          ))}
        </div>

        {rooms.map((room) => (
          <div
            key={room.id}
            className="relative border-r border-gray-100 last:border-r-0 bg-white cursor-pointer group/col"
            style={{ height: timelineHeight }}
            onClick={(ev) => handleColumnClick(ev, room.id)}
            role="presentation"
          >
            {DAY_TIMELINE_HOURS.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-gray-100/90 pointer-events-none"
                style={{ top: i * DAY_HOUR_HEIGHT_PX }}
              />
            ))}

            {(eventsByRoom.get(room.id) ?? []).map((evt) => {
              const { top, height } = computeEventTimelineBounds(
                evt.time,
                evt.duration
              );
              return (
                <div
                  key={evt.id}
                  data-event-card
                  className="absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5"
                  style={{ top, height: Math.max(height, 36) }}
                >
                  <EventCard
                    evt={evt}
                    compact
                    timeline
                    onEdit={onEventEdit}
                    onDelete={onEventDelete}
                  />
                </div>
              );
            })}

            <button
              type="button"
              className="absolute bottom-3 right-3 z-20 opacity-0 group-hover/col:opacity-100 rounded-full border border-dashed border-[#A473FF]/50 p-1.5 text-[#A473FF] bg-white/95 shadow-sm transition-opacity hover:bg-[#F3EEFF]"
              onClick={(ev) => {
                ev.stopPropagation();
                onQuickCreate?.(room.id, dayShort, "09:00", calendarDate);
              }}
              aria-label={`Add schedule item to ${room.name}`}
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
