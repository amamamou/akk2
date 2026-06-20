"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Library,
  MapPin,
  Radio,
  Signal,
  WifiOff,
} from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { LiveSummary, ScheduleSnapshotItem, SystemAlertItem } from "@/lib/dashboard-insights";
import {
  dashboardAccentDot,
  dashboardIconChip,
  dashboardLinkAction,
  dashboardMetricAccent,
  dashboardMetricValue,
  dashboardMutedSurface,
  dashboardSectionLabel,
  statusCriticalBg,
  statusCriticalText,
  statusOkText,
  statusWarnBg,
  statusWarnText,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

interface OperationsOverviewProps {
  alerts: SystemAlertItem[];
  liveSummary: LiveSummary;
  upcoming: ScheduleSnapshotItem[];
}

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const statConfig = [
  { key: "online" as const, label: "Online", icon: Signal },
  { key: "playing" as const, label: "Playing", icon: Radio },
  { key: "offline" as const, label: "Offline", icon: WifiOff },
  { key: "health" as const, label: "Health", icon: Activity },
];

export default function OperationsOverview({
  alerts,
  liveSummary,
  upcoming,
}: OperationsOverviewProps) {
  const hasAlert = alerts.length > 0;
  const primary = alerts[0];

  const statValues: Record<(typeof statConfig)[number]["key"], string | number> = {
    online: liveSummary.online,
    playing: liveSummary.playing,
    offline: liveSummary.offline,
    health: `${liveSummary.healthRate.toFixed(1)}%`,
  };

  return (
    <DashboardPanel
      title="Operations Overview"
      className="h-fit w-full self-start"
      noPadding
      bodyClassName="p-0"
    >
      {/* Primary status block */}
      <div
        className={cn(
          "border-b border-gray-100 px-6 py-5 dark:border-zinc-800",
          hasAlert
            ? primary.severity === "critical"
              ? statusCriticalBg
              : statusWarnBg
            : dashboardMutedSurface
        )}
      >
        {hasAlert ? (
          <div className="flex gap-3">
            {primary.severity === "critical" ? (
              <AlertCircle size={18} className={statusCriticalText} />
            ) : (
              <AlertTriangle size={18} className={statusWarnText} />
            )}
            <div>
              <p className="text-base font-semibold text-gray-950 dark:text-zinc-100">{primary.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{primary.message}</p>
              {alerts.length > 1 && (
                <p className="mt-2 text-xs text-gray-400">+{alerts.length - 1} additional alert{alerts.length > 2 ? "s" : ""}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={cn(dashboardIconChip, "h-9 w-9")}>
              <CheckCircle2 size={16} strokeWidth={2} className={statusOkText} />
            </div>
            <div>
              <p className={cn("text-base font-semibold", statusOkText)}>All systems operational</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400">
                <Signal size={12} strokeWidth={2} className="text-gray-400" />
                {liveSummary.online} players connected
                <span className="text-gray-300">·</span>
                <Radio size={12} strokeWidth={2} className={liveSummary.playing > 0 ? "text-[#A473FF]" : "text-gray-400"} />
                {liveSummary.playing} broadcasting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 dark:divide-zinc-800 dark:border-zinc-800">
        {statConfig.map((stat) => {
          const value = statValues[stat.key];
          const isPlaying = stat.key === "playing" && liveSummary.playing > 0;
          const Icon = stat.icon;

          return (
            <div key={stat.key} className="px-4 py-4 text-center">
              <p
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  isPlaying ? dashboardMetricAccent : dashboardMetricValue
                )}
              >
                {value}
              </p>
              <p className={cn("mt-1 inline-flex items-center justify-center gap-1", dashboardSectionLabel)}>
                <Icon
                  size={10}
                  strokeWidth={2}
                  className={isPlaying ? "text-[#A473FF]/70" : "text-gray-400"}
                />
                {stat.label}
                {isPlaying && <span className={dashboardAccentDot} aria-hidden />}
              </p>
            </div>
          );
        })}
      </div>

      {/* Upcoming broadcasts */}
      {upcoming.length > 0 && (
        <div className="border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <p className={cn("inline-flex items-center gap-1", dashboardSectionLabel)}>
              <CalendarRange size={10} strokeWidth={2} />
              Next broadcasts
            </p>
            <Link href="/schedule" className={dashboardLinkAction}>
              Schedule
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="inline-flex w-12 shrink-0 items-center gap-0.5 text-xs font-bold tabular-nums text-gray-700 dark:text-zinc-300">
                  {item.phase === "active" ? (
                    <>
                      <span className={dashboardAccentDot} aria-hidden />
                      Now
                    </>
                  ) : (
                    timeFmt.format(item.startsAt)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">{item.title}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-gray-400">
                    <MapPin size={10} strokeWidth={2} className="shrink-0" />
                    {item.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex flex-wrap gap-1 px-4 py-3">
        {[
          { href: "/schedule", icon: CalendarDays, label: "Schedule" },
          { href: "/library", icon: Library, label: "Library" },
          { href: "/analytics", icon: BarChart3, label: "Analytics" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#8B5CF6] dark:hover:bg-zinc-800/40 dark:hover:text-[#A473FF]"
          >
            <action.icon size={13} strokeWidth={1.9} />
            {action.label}
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
