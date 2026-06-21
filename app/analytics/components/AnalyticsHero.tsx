"use client";

import React from "react";
import { CalendarDays, CalendarRange, Clock3 } from "lucide-react";
import {
  dashboardHeroSectionClass,
  dashboardMutedSurface,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export type AnalyticsTimeRange = "today" | "7d" | "month";

const PERIOD_OPTIONS: {
  value: AnalyticsTimeRange;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "today", label: "Today", icon: Clock3 },
  { value: "7d", label: "Last 7 days", icon: CalendarRange },
  { value: "month", label: "This month", icon: CalendarDays },
];

interface AnalyticsHeroProps {
  timeRange: AnalyticsTimeRange;
  onTimeRangeChange: (range: AnalyticsTimeRange) => void;
}

export default function AnalyticsHero({
  timeRange,
  onTimeRangeChange,
}: AnalyticsHeroProps) {
  return (
    <section className={dashboardHeroSectionClass}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className={dashboardSectionLabel}>Operations · Listening metrics</p>
          <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
            Analytics
          </h1>
          <p className={cn(dashboardPanelSubtitle, "max-w-xl text-sm")}>
            Track playback, engagement, and listener trends across your fleet and programs.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:min-w-[320px] lg:w-auto lg:items-end">
          <span className={cn(dashboardSectionLabel, "lg:text-right")}>Period</span>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {PERIOD_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = timeRange === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onTimeRangeChange(opt.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-[#A473FF]/10 text-[#7C3AED] ring-1 ring-[#A473FF]/20 dark:text-[#A473FF]"
                      : cn(
                          dashboardMutedSurface,
                          "text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )
                  )}
                >
                  <Icon size={12} strokeWidth={2} className="opacity-70" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
