"use client";

import React from "react";
import { Building2, Signal, TrendingUp } from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { VenueInsight } from "@/lib/dashboard-insights";
import {
  dashboardAccentBar,
  dashboardAccentDot,
  dashboardAccentIcon,
  dashboardIconChip,
  dashboardMetricAccent,
  dashboardMutedSurface,
  statusNeutralText,
  statusOkText,
  statusWarnText,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

function VenueCard({
  venue,
  rank,
  maxPlaybacks,
}: {
  venue: VenueInsight;
  rank: number;
  maxPlaybacks: number;
}) {
  const barWidth =
    maxPlaybacks > 0 && venue.playbackCount > 0
      ? Math.round((venue.playbackCount / maxPlaybacks) * 100)
      : 0;
  const isTop = rank === 0;

  return (
    <div className={cn("p-3", dashboardMutedSurface)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn(dashboardIconChip, "h-6 w-6")}>
            <Building2 size={12} strokeWidth={2} className={isTop ? dashboardAccentIcon : "text-gray-400"} />
          </div>
          <p className="truncate text-sm font-semibold text-gray-950 dark:text-zinc-100">
            {venue.name}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-[10px] font-medium tabular-nums",
            isTop ? dashboardMetricAccent : "text-gray-400"
          )}
        >
          #{rank + 1}
        </span>
      </div>
      <p className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
        <span className="inline-flex items-center gap-0.5">
          <Signal size={10} strokeWidth={2} className={venue.onlineCount > 0 ? statusOkText : "text-gray-300"} />
          {venue.onlineCount} online
        </span>
        <span>·</span>
        <span>{venue.playerCount} players</span>
        <span>·</span>
        <span className="inline-flex items-center gap-0.5">
          {isTop && <TrendingUp size={10} strokeWidth={2} className={dashboardAccentIcon} />}
          {venue.playbackCount} plays
        </span>
      </p>
      {barWidth > 0 && (
        <div className="mt-2">
          <div className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
            <div
              className={cn("h-full rounded-full", isTop ? dashboardAccentBar : "bg-gray-900/60 dark:bg-zinc-300")}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      )}
      <p className={cn("mt-1.5 flex items-center gap-1.5 text-[10px] font-medium", statusNeutralText)}>
        {venue.playbackCount > 0 && venue.successRate !== null ? (
          <>
            {venue.successRate >= 90 && <span className={dashboardAccentDot} aria-hidden />}
            <span className={venue.successRate >= 90 ? statusOkText : statusWarnText}>
              {venue.successRate}% playback success
            </span>
          </>
        ) : (
          "No playback data yet"
        )}
      </p>
    </div>
  );
}

export default function VenueInsights({ venues }: { venues: VenueInsight[] }) {
  const maxPlaybacks = Math.max(0, ...venues.map((v) => v.playbackCount));

  return (
    <DashboardPanel
      title="Venue Insights"
      subtitle="Ranked by playback volume"
      className="h-fit w-full self-start"
    >
      {venues.length === 0 ? (
        <p className="text-xs text-gray-400">No venue data available</p>
      ) : (
        <div className="space-y-2">
          {venues.map((venue, i) => (
            <VenueCard key={venue.name} venue={venue} rank={i} maxPlaybacks={maxPlaybacks} />
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
