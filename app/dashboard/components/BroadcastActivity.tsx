"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BROADCAST_ACTIVITY_COLORS,
  type BroadcastActivityCell,
  type BroadcastActivitySummary,
  formatActivityDate,
} from "@/lib/broadcast-activity";
import {
  dashboardCardClass,
  dashboardCardPadding,
} from "../dashboard-styles";

interface BroadcastActivityProps {
  summary: BroadcastActivitySummary;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const CELL = "h-[13px] w-[13px]";

function formatGrowth(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat(undefined).format(value);
}

function HeatmapCell({
  cell,
  onHover,
  onLeave,
}: {
  cell: BroadcastActivityCell;
  onHover: (cell: BroadcastActivityCell, rect: DOMRect) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const color = BROADCAST_ACTIVITY_COLORS[cell.level];

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={`${formatActivityDate(cell.date)}: ${cell.total} operations`}
      disabled={cell.isFuture}
      onMouseEnter={() => {
        if (ref.current && !cell.isFuture) onHover(cell, ref.current.getBoundingClientRect());
      }}
      onFocus={() => {
        if (ref.current && !cell.isFuture) onHover(cell, ref.current.getBoundingClientRect());
      }}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      whileHover={
        cell.isFuture
          ? undefined
          : { scale: 1.15, boxShadow: "0 3px 10px rgba(139, 88, 255, 0.25)" }
      }
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={[
        CELL,
        "rounded-[4px] border border-white/60 dark:border-zinc-900/40",
        cell.isToday ? "ring-2 ring-[#A473FF]/35 ring-offset-1" : "",
        cell.isFuture ? "cursor-default opacity-35" : "cursor-pointer",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: cell.isFuture ? "#F4EDFF" : color }}
    />
  );
}

function ActivityTooltip({
  cell,
  anchor,
}: {
  cell: BroadcastActivityCell;
  anchor: DOMRect;
}) {
  const left = Math.min(
    Math.max(anchor.left + anchor.width / 2, 120),
    typeof window !== "undefined" ? window.innerWidth - 120 : anchor.left
  );

  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full"
      style={{ left, top: anchor.top - 8 }}
    >
      <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">
          {formatActivityDate(cell.date)}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-gray-950 dark:text-zinc-100">
          {cell.total} operations
        </p>
        <div className="mt-2 space-y-1 text-[11px] text-gray-500 dark:text-zinc-400">
          <div className="flex justify-between gap-4">
            <span>Broadcasts</span>
            <span className="font-medium text-gray-700 dark:text-zinc-300">{cell.broadcasts}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Schedules</span>
            <span className="font-medium text-gray-700 dark:text-zinc-300">{cell.schedules}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Playbacks</span>
            <span className="font-medium text-gray-700 dark:text-zinc-300">{cell.playbacks}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BroadcastActivity({ summary }: BroadcastActivityProps) {
  const [hovered, setHovered] = useState<{ cell: BroadcastActivityCell; rect: DOMRect } | null>(
    null
  );

  const weeks = useMemo(() => {
    const columns: BroadcastActivityCell[][] = Array.from({ length: summary.weekCount }, () => []);
    for (const cell of summary.cells) {
      if (columns[cell.weekIndex]) columns[cell.weekIndex].push(cell);
    }
    return columns.map((week) => week.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  }, [summary.cells, summary.weekCount]);

  const growthPositive = summary.monthGrowthPercent >= 0;

  return (
    <section className={`h-fit w-full ${dashboardCardClass} ${dashboardCardPadding}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-gray-950 dark:text-zinc-100">
            Broadcast Activity
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
            Platform-wide playback operations
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xl font-semibold tabular-nums tracking-tight text-gray-950 dark:text-zinc-100">
            {formatCount(summary.totalBroadcasts)} total
          </p>
          <p
            className={[
              "text-xs font-medium",
              growthPositive ? "text-emerald-600" : "text-rose-500",
            ].join(" ")}
          >
            {formatGrowth(summary.monthGrowthPercent)} this month
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3">
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col gap-[3px] pt-px text-[10px] font-medium text-gray-400">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className={`flex ${CELL} items-center leading-none`}>
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-1 gap-[3px] overflow-x-auto px-0.5 pt-1 pb-0.5">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((cell) => (
                  <HeatmapCell
                    key={cell.dateKey}
                    cell={cell}
                    onHover={(c, rect) => setHovered({ cell: c, rect })}
                    onLeave={() => setHovered(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-gray-400">
          <span>Less</span>
          <div className="flex gap-[2px]">
            {BROADCAST_ACTIVITY_COLORS.map((color) => (
              <span
                key={color}
                className="h-[9px] w-[9px] rounded-[2px] border border-white/60"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-zinc-700/60">
        {[
          { label: "Top Venue", value: summary.mostActiveVenue },
          { label: "Peak Day", value: summary.mostActiveDay },
          { label: "Success", value: `${summary.playbackSuccessPercent.toFixed(1)}%` },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {item.label}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-gray-950 dark:text-zinc-100">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hovered ? <ActivityTooltip cell={hovered.cell} anchor={hovered.rect} /> : null}
      </AnimatePresence>
    </section>
  );
}
