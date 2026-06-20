"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Radio,
} from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { TimelineActivity } from "@/lib/dashboard-insights";
import {
  dashboardAccentDot,
  dashboardAccentIcon,
  dashboardMutedSurface,
  statusCriticalBg,
  statusCriticalText,
  statusOkBg,
  statusOkText,
  statusWarnBg,
  statusWarnText,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

const typeConfig: Record<
  TimelineActivity["type"],
  { icon: React.ElementType; iconClass: string; surface: string; branded?: boolean }
> = {
  start: {
    icon: PlayCircle,
    iconClass: dashboardAccentIcon,
    surface: "bg-[#A473FF]/8 ring-1 ring-[#A473FF]/12 dark:bg-[#A473FF]/12 dark:ring-[#A473FF]/18",
    branded: true,
  },
  connect: {
    icon: Radio,
    iconClass: dashboardAccentIcon,
    surface: "bg-[#A473FF]/8 ring-1 ring-[#A473FF]/12 dark:bg-[#A473FF]/12 dark:ring-[#A473FF]/18",
    branded: true,
  },
  complete: { icon: CheckCircle2, iconClass: statusOkText, surface: statusOkBg },
  update: { icon: Calendar, iconClass: "text-gray-600 dark:text-zinc-300", surface: dashboardMutedSurface },
  alert: { icon: AlertTriangle, iconClass: statusWarnText, surface: statusWarnBg },
};

export default function ActivityTimeline({ activities }: { activities: TimelineActivity[] }) {
  const visible = activities.slice(0, 6);

  return (
    <DashboardPanel
      title="Recent Activity"
      subtitle="Platform events"
      className="h-fit w-full self-start"
      noPadding
      bodyClassName="px-6 py-4"
    >
      {visible.length === 0 ? (
        <p className="text-xs text-gray-400">No recent activity</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-zinc-700/60">
          {visible.map((activity) => {
            const config = typeConfig[activity.type];
            const Icon = config.icon;
            const isFailure = activity.type === "alert";

            return (
              <li
                key={activity.id}
                className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    isFailure ? statusCriticalBg : config.surface
                  )}
                >
                  <Icon
                    size={13}
                    strokeWidth={2}
                    className={isFailure ? statusCriticalText : config.iconClass}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
                      {config.branded && <span className={dashboardAccentDot} aria-hidden />}
                      {activity.action}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] tabular-nums text-gray-400">
                      <Clock3 size={10} strokeWidth={2} />
                      {activity.time}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-gray-600 dark:text-zinc-300">
                    {activity.type === "connect" && (
                      <Activity size={10} strokeWidth={2} className="shrink-0 text-gray-400" />
                    )}
                    {activity.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
