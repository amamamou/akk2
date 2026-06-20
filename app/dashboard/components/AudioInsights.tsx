"use client";

import React from "react";
import { AudioLines, CalendarRange, Headphones } from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import type { AudioInsightData } from "@/lib/dashboard-insights";
import {
  dashboardAccentIcon,
  dashboardIconChip,
  dashboardMutedSurface,
  dashboardSectionLabel,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

function MiniWaveform() {
  return (
    <span className="ml-1 inline-flex h-3 items-end gap-[2px]" aria-hidden>
      {[3, 5, 4].map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-gradient-to-t from-[#202538] to-[#A473FF]"
          style={{ height: h }}
        />
      ))}
    </span>
  );
}

function AudioStat({
  icon: Icon,
  label,
  value,
  sub,
  showWaveform,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  showWaveform?: boolean;
}) {
  return (
    <div className={`p-4 ${dashboardMutedSurface}`}>
      <div className="flex items-center gap-2">
        <div className={cn(dashboardIconChip, "h-7 w-7")}>
          <Icon size={14} strokeWidth={2} className={dashboardAccentIcon} />
        </div>
        <span className={dashboardSectionLabel}>{label}</span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-gray-950 dark:text-zinc-100">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 flex items-center text-[10px] text-gray-500 dark:text-zinc-400">
          {sub}
          {showWaveform && <MiniWaveform />}
        </p>
      )}
    </div>
  );
}

export default function AudioInsights({ data }: { data: AudioInsightData }) {
  return (
    <DashboardPanel
      title="Audio Insights"
      subtitle="From playback logs & schedules"
      className="h-fit self-start"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AudioStat
          icon={Headphones}
          label="Most Played"
          value={data.mostPlayed?.title ?? "No plays yet"}
          sub={data.mostPlayed ? `${data.mostPlayed.count} plays` : undefined}
          showWaveform={Boolean(data.mostPlayed)}
        />
        <AudioStat
          icon={CalendarRange}
          label="Most Scheduled"
          value={data.mostScheduled?.title ?? "No schedules yet"}
          sub={data.mostScheduled ? `${data.mostScheduled.count} slots` : undefined}
        />
        <AudioStat
          icon={AudioLines}
          label="Library"
          value={`${data.librarySize} tracks`}
          sub={`${data.playbackCount} logged plays`}
          showWaveform={data.playbackCount > 0}
        />
      </div>
    </DashboardPanel>
  );
}
