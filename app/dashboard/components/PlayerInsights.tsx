"use client";

import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  MapPin,
  Signal,
  Trophy,
  Users,
  WifiOff,
} from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { PlayerInsightData } from "@/lib/dashboard-insights";
import {
  dashboardAccentDot,
  dashboardAccentIcon,
  dashboardIconChip,
  dashboardMetricAccent,
  dashboardMetricValue,
  dashboardMutedSurface,
  dashboardSectionLabel,
  statusOkText,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

function InsightTile({
  label,
  value,
  icon: Icon,
  active,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  active?: boolean;
  trend?: "up" | "down" | null;
}) {
  return (
    <div className={`p-4 ${dashboardMutedSurface}`}>
      <div className="flex items-center gap-2">
        <div className={cn(dashboardIconChip, "h-7 w-7")}>
          <Icon
            size={14}
            strokeWidth={2}
            className={active ? dashboardAccentIcon : "text-gray-400"}
          />
        </div>
        <span className={dashboardSectionLabel}>{label}</span>
        {active && <span className={dashboardAccentDot} aria-hidden />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums tracking-tight",
            active && Number(value) > 0 ? dashboardMetricAccent : dashboardMetricValue
          )}
        >
          {value}
        </p>
        {trend === "up" && (
          <ArrowUpRight size={14} strokeWidth={2.5} className={statusOkText} aria-hidden />
        )}
        {trend === "down" && (
          <ArrowDownRight size={14} strokeWidth={2.5} className="text-gray-400" aria-hidden />
        )}
      </div>
    </div>
  );
}

export default function PlayerInsights({ data }: { data: PlayerInsightData }) {
  const onlineLeading = data.onlineCount >= data.offlineCount;

  return (
    <DashboardPanel title="Player Insights" subtitle="Fleet intelligence" className="h-fit self-start">
      <div className="grid grid-cols-2 gap-4">
        <InsightTile
          label="Online"
          value={data.onlineCount}
          icon={Signal}
          active={data.onlineCount > 0}
          trend={onlineLeading && data.onlineCount > 0 ? "up" : null}
        />
        <InsightTile
          label="Offline"
          value={data.offlineCount}
          icon={WifiOff}
          trend={!onlineLeading && data.offlineCount > 0 ? "down" : null}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className={`flex items-center gap-3 p-3 ${dashboardMutedSurface}`}>
          <div className={cn(dashboardIconChip, "h-9 w-9")}>
            <Trophy size={15} className={dashboardAccentIcon} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className={dashboardSectionLabel}>Most Active Player</p>
            <p className="truncate text-sm font-semibold text-gray-950 dark:text-zinc-100">
              {data.mostActivePlayer}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-3 ${dashboardMutedSurface}`}>
          <div className={cn(dashboardIconChip, "h-9 w-9")}>
            <MapPin size={15} className={dashboardAccentIcon} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className={dashboardSectionLabel}>Highest Usage Room</p>
            <p className="truncate text-sm font-semibold text-gray-950 dark:text-zinc-100">
              {data.highestUsageRoom}
            </p>
          </div>
        </div>
      </div>

      <div className={`mt-4 flex items-center justify-between px-3 py-2 ${dashboardMutedSurface}`}>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users size={12} strokeWidth={2} className="text-gray-400" />
          Total fleet
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-950 dark:text-zinc-100">
          {data.totalPlayers} players
        </span>
      </div>
    </DashboardPanel>
  );
}
