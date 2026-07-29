"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isInRange(day: Date, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return false;
  const t = startOfDay(day).getTime();
  return t >= startOfDay(from).getTime() && t <= startOfDay(to).getTime();
}

function formatShort(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function buildMonthGrid(view: Date): (Date | null)[] {
  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay(); // 0 Sun
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface AnalyticsDateRangePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DateRangeValue;
  onApply: (range: { from: Date; to: Date }) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export default function AnalyticsDateRangePicker({
  open,
  onOpenChange,
  value,
  onApply,
}: AnalyticsDateRangePickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfDay(value.from ?? value.to ?? new Date())
  );
  const [draftFrom, setDraftFrom] = useState<Date | null>(value.from);
  const [draftTo, setDraftTo] = useState<Date | null>(value.to);

  useEffect(() => {
    if (!open) return;
    setDraftFrom(value.from);
    setDraftTo(value.to);
    setViewMonth(startOfDay(value.from ?? value.to ?? new Date()));
  }, [open, value.from, value.to]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-analytics-calendar-root]")) return;
      onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onOpenChange]);

  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const today = startOfDay(new Date());
  const canApply = Boolean(draftFrom && draftTo);

  const selectDay = (day: Date) => {
    const d = startOfDay(day);
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(d);
      setDraftTo(null);
      return;
    }
    if (isBeforeDay(d, draftFrom)) {
      setDraftFrom(d);
      setDraftTo(null);
      return;
    }
    setDraftTo(d);
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Custom date range"
      className={cn(
        "absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border p-3 shadow-lg",
        "border-gray-100 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
        "dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() =>
            setViewMonth(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
            )
          }
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-gray-950 dark:text-zinc-100">
          {monthLabel(viewMonth)}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() =>
            setViewMonth(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
            )
          }
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="h-9" />;
          }
          const selectedStart = draftFrom ? sameDay(day, draftFrom) : false;
          const selectedEnd = draftTo ? sameDay(day, draftTo) : false;
          const inRange = isInRange(day, draftFrom, draftTo);
          const isToday = sameDay(day, today);
          const isEndpoint = selectedStart || selectedEnd;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => selectDay(day)}
              className={cn(
                "relative h-9 rounded-lg text-xs font-medium transition-colors",
                !isEndpoint &&
                  !inRange &&
                  "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                inRange &&
                  !isEndpoint &&
                  "bg-[#A473FF]/10 text-[#7C3AED] dark:bg-[#A473FF]/15 dark:text-[#C4B3FF]",
                isEndpoint &&
                  "bg-[#A473FF] text-white hover:bg-[#9563f0] dark:bg-[#A473FF] dark:text-white dark:hover:bg-[#B68BFF]",
                isToday &&
                  !isEndpoint &&
                  "ring-1 ring-[#A473FF]/35 dark:ring-[#A473FF]/50"
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-zinc-800">
        <p className="text-[11px] text-gray-500 dark:text-zinc-400">
          {draftFrom && draftTo
            ? `${formatShort(draftFrom)} → ${formatShort(draftTo)}`
            : draftFrom
              ? `${formatShort(draftFrom)} → pick end date`
              : "Select a start and end date"}
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canApply}
            onClick={() => {
              if (!draftFrom || !draftTo) return;
              onApply({ from: startOfDay(draftFrom), to: endOfDay(draftTo) });
              onOpenChange(false);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              canApply
                ? "bg-[#A473FF] text-white hover:bg-[#9563f0] dark:hover:bg-[#B68BFF]"
                : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-600"
            )}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function formatDateRangeLabel(range: DateRangeValue): string {
  if (range.from && range.to) {
    const same =
      range.from.getMonth() === range.to.getMonth() &&
      range.from.getFullYear() === range.to.getFullYear() &&
      range.from.getDate() === range.to.getDate();
    if (same) return formatShort(range.from);
    return `${range.from.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} – ${formatShort(range.to)}`;
  }
  return "Custom";
}
