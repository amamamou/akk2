"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Library,
  BarChart3,
  Radio,
} from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { ScheduleSnapshotItem } from "@/lib/dashboard-insights";
import { dashboardCardClass, dashboardMutedSurface } from "../dashboard-styles";

interface AlertItem {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

interface OperationsRailProps {
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
  critical: "bg-rose-50/80 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
  warning: "bg-amber-50/80 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  info: "bg-sky-50/80 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
};

function AlertIcon({ severity }: { severity: AlertItem["severity"] }) {
  if (severity === "critical") return <AlertCircle size={14} strokeWidth={2} />;
  if (severity === "warning") return <AlertTriangle size={14} strokeWidth={2} />;
  return <CheckCircle size={14} strokeWidth={2} />;
}

const timeFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default function OperationsRail({ alerts, upcoming, liveSummary }: OperationsRailProps) {
  return (
    <div className="flex h-fit flex-col gap-4">
      <DashboardPanel title="Alerts" noPadding bodyClassName="px-6 py-4">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            All systems operational
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-2.5 p-3 ${dashboardMutedSurface}`}
              >
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    alertStyles[alert.severity],
                  ].join(" ")}
                >
                  <AlertIcon severity={alert.severity} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {alert.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel title="Live Status" noPadding bodyClassName="px-6 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 ${dashboardMutedSurface}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Online</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-gray-950 dark:text-zinc-100">
              {liveSummary.online}
            </p>
          </div>
          <div className={`p-3 ${dashboardMutedSurface}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Playing</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {liveSummary.playing}
            </p>
          </div>
          <div className={`p-3 ${dashboardMutedSurface}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Offline</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-500">
              {liveSummary.offline}
            </p>
          </div>
          <div className={`p-3 ${dashboardMutedSurface}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Health</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
              {liveSummary.healthRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </DashboardPanel>

      {/* Upcoming */}
      <DashboardPanel
        title="Upcoming"
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
          <p className="text-xs text-zinc-400">No upcoming broadcasts</p>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 4).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
              >
                <div className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center text-[10px] font-bold leading-none text-gray-700 dark:text-zinc-300 ${dashboardMutedSurface}`}>
                  <span>{timeFmt.format(item.startsAt).split(",")[1]?.trim() ?? ""}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </p>
                  <p className="truncate text-[11px] text-zinc-400">{item.location}</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                  {item.durationMinutes}m
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel title="Quick Actions" noPadding bodyClassName="px-6 py-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/schedule", icon: CalendarDays, label: "Schedule" },
            { href: "/library", icon: Library, label: "Library" },
            { href: "/analytics", icon: BarChart3, label: "Analytics" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 transition-colors group-hover:bg-[#F3EEFF] dark:bg-zinc-800 dark:group-hover:bg-zinc-700/80">
                <action.icon
                  size={15}
                  strokeWidth={1.9}
                  className="text-gray-500 transition-colors group-hover:text-[#6B46FF]"
                />
              </div>
              <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </DashboardPanel>

      <div className={`flex items-center gap-2 px-4 py-3 ${dashboardCardClass}`}>
        <Radio size={14} className="text-[#6B46FF]" strokeWidth={2} />
        <span className="text-xs text-zinc-500">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {liveSummary.online}
          </span>{" "}
          venues live now
        </span>
      </div>
    </div>
  );
}
