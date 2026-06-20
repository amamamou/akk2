"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Library,
  BarChart3,
} from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { ScheduleSnapshotItem } from "@/lib/dashboard-insights";
import { dashboardMutedSurface } from "../dashboard-styles";

interface AlertItem {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

interface OperationsBarProps {
  alerts: AlertItem[];
  upcoming: ScheduleSnapshotItem[];
  liveSummary: {
    online: number;
    offline: number;
    playing: number;
    healthRate: number;
  };
}

const alertStyles = {
  critical: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
};

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function AlertIcon({ severity }: { severity: AlertItem["severity"] }) {
  if (severity === "critical") return <AlertCircle size={13} strokeWidth={2} />;
  if (severity === "warning") return <AlertTriangle size={13} strokeWidth={2} />;
  return <CheckCircle size={13} strokeWidth={2} />;
}

export default function OperationsBar({
  alerts,
  upcoming,
  liveSummary,
}: OperationsBarProps) {
  const primaryAlert = alerts[0];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Alerts */}
      <DashboardPanel title="Alerts" className="h-fit" noPadding bodyClassName="px-6 py-4">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All systems operational
          </div>
        ) : (
          <div className={`flex items-start gap-2.5 p-3 ${dashboardMutedSurface}`}>
            <div
              className={[
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                alertStyles[primaryAlert.severity],
              ].join(" ")}
            >
              <AlertIcon severity={primaryAlert.severity} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-950 dark:text-zinc-100">
                {primaryAlert.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500 dark:text-zinc-400">
                {primaryAlert.message}
              </p>
              {alerts.length > 1 && (
                <p className="mt-1 text-[10px] font-medium text-gray-400">
                  +{alerts.length - 1} more
                </p>
              )}
            </div>
          </div>
        )}
      </DashboardPanel>

      {/* Live status */}
      <DashboardPanel title="Live Status" className="h-fit" noPadding bodyClassName="px-6 py-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Online", value: liveSummary.online },
            { label: "Playing", value: liveSummary.playing },
            { label: "Offline", value: liveSummary.offline },
            { label: "Health", value: `${liveSummary.healthRate.toFixed(0)}%` },
          ].map((stat) => (
            <div key={stat.label} className={`px-2 py-2 text-center ${dashboardMutedSurface}`}>
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                {stat.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-950 dark:text-zinc-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </DashboardPanel>

      {/* Upcoming */}
      <DashboardPanel
        title="Upcoming"
        className="h-fit"
        action={
          <Link
            href="/schedule"
            className="text-[11px] font-medium text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
          >
            View all
          </Link>
        }
        noPadding
        bodyClassName="px-6 py-4"
      >
        {upcoming.length === 0 ? (
          <p className="text-xs text-gray-400">No upcoming broadcasts</p>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/40"
              >
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold tabular-nums text-gray-700 dark:text-zinc-300 ${dashboardMutedSurface}`}
                >
                  {timeFmt.format(item.startsAt)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-950 dark:text-zinc-100">
                    {item.title}
                  </p>
                  <p className="truncate text-[10px] text-gray-400">{item.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {/* Quick actions */}
      <DashboardPanel title="Quick Actions" className="h-fit" noPadding bodyClassName="px-6 py-4">
        <div className="flex gap-2">
          {[
            { href: "/schedule", icon: CalendarDays, label: "Schedule" },
            { href: "/library", icon: Library, label: "Library" },
            { href: "/analytics", icon: BarChart3, label: "Analytics" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/40 ${dashboardMutedSurface}`}
            >
              <action.icon
                size={15}
                strokeWidth={1.9}
                className="text-gray-500 transition-colors group-hover:text-[#6B46FF]"
              />
              <span className="text-[10px] font-medium text-gray-500">{action.label}</span>
            </Link>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
