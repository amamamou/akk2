"use client";

import React from "react";
import Link from "next/link";
import { CalendarRange, Clock3, MapPin, Radio } from "lucide-react";
import type { ScheduleSnapshotItem } from "@/lib/dashboard-insights";
import DashboardPanel from "./DashboardPanel";
import {
  dashboardAccentDot,
  dashboardLinkAction,
  dashboardMutedSurface,
  dashboardSectionLabel,
  dashboardTimelineLine,
  statusNeutralText,
  statusOkDot,
  statusOkText,
  statusWarnDot,
  statusWarnText,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

function phaseMeta(item: ScheduleSnapshotItem) {
  if (item.phase === "active") {
    return {
      pill: "On air",
      pillClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
      markerClass: statusOkDot,
      timeClass: statusOkText,
      timeIcon: Radio,
    };
  }

  const startsIn = item.startsAt.getTime() - Date.now();
  const soon = startsIn > 0 && startsIn <= 15 * 60_000;

  if (soon) {
    return {
      pill: `In ${Math.max(1, Math.round(startsIn / 60_000))}m`,
      pillClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
      markerClass: statusWarnDot,
      timeClass: statusWarnText,
      timeIcon: Clock3,
    };
  }

  return {
    pill: "Upcoming",
    pillClass: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
    markerClass: "bg-gradient-to-br from-[#202538] to-[#A473FF]",
    timeClass: "text-gray-700 dark:text-zinc-300",
    timeIcon: CalendarRange,
  };
}

export default function ScheduleSnapshot({ items }: { items: ScheduleSnapshotItem[] }) {
  const visible = items.slice(0, 6);
  const activeCount = visible.filter((i) => i.phase === "active").length;

  return (
    <DashboardPanel
      className="h-fit w-full"
      title="Schedule Snapshot"
      subtitle={
        activeCount > 0
          ? `${activeCount} on air now`
          : "Today's upcoming broadcasts"
      }
      action={
        <Link href="/schedule" className={dashboardLinkAction}>
          Calendar
        </Link>
      }
      noPadding
      bodyClassName="px-4 py-3"
    >
      {visible.length === 0 ? (
        <p className="px-2 py-2 text-xs text-gray-400">No scheduled broadcasts</p>
      ) : (
        <ul className="relative space-y-1.5 pl-1">
          <div className={cn("absolute bottom-2 left-[5px] top-2 w-px", dashboardTimelineLine)} aria-hidden />
          {visible.map((item) => {
            const meta = phaseMeta(item);
            const TimeIcon = meta.timeIcon;
            return (
              <li
                key={item.id}
                className={cn("relative rounded-xl px-3 py-2.5 pl-5", dashboardMutedSurface)}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-2 w-2 -translate-x-[2px] -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-zinc-900",
                    meta.markerClass
                  )}
                  aria-hidden
                />
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", meta.timeClass)}>
                        <TimeIcon size={11} strokeWidth={2} className="opacity-70" />
                        {item.timeLabel}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                          meta.pillClass
                        )}
                      >
                        {meta.pill}
                      </span>
                      {item.isLoop && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400">
                          <span className={dashboardAccentDot} aria-hidden />
                          Daily
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
                      {item.title}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                      <MapPin size={10} strokeWidth={2} className="shrink-0 text-gray-400" />
                      {item.location}
                    </p>
                  </div>
                  <span className={cn("inline-flex shrink-0 items-center gap-0.5 text-[10px] tabular-nums", statusNeutralText)}>
                    <Clock3 size={10} strokeWidth={2} className="text-gray-400" />
                    {item.durationMinutes}m
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {visible.length > 0 && (
        <p className={cn("mt-3 px-2", dashboardSectionLabel)}>
          {visible.length} events · live schedule data
        </p>
      )}
    </DashboardPanel>
  );
}
