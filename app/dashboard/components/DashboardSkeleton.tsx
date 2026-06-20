import React from "react";
import {
  dashboardCardClass,
  dashboardCardPadding,
  dashboardCommandLayout,
  dashboardContainerClass,
  dashboardHalfRow,
  dashboardHeroSectionClass,
  dashboardMainColumn,
  dashboardMutedSurface,
  dashboardPageClass,
  dashboardSidebarColumn,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

const HEATMAP_WEEKS = 14;
const HEATMAP_ROWS = 7;
const CELL = "h-[13px] w-[13px]";

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800", className)}
      style={style}
      aria-hidden="true"
    />
  );
}

/** Mirrors DashboardPanel shell exactly. */
function PanelShell({
  title,
  subtitle,
  action,
  noPadding,
  bodyClassName,
  headerBorder = true,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: boolean;
  noPadding?: boolean;
  bodyClassName?: string;
  headerBorder?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(dashboardCardClass, "h-fit min-h-0 w-full", className)} aria-hidden="true">
      {title && (
        <header
          className={cn(
            "flex items-start justify-between gap-3 px-6 py-4",
            headerBorder && "border-b border-gray-100 dark:border-zinc-700/60"
          )}
        >
          <div className="min-w-0">
            <Bone className={cn("h-4", title.length > 20 ? "w-40" : "w-32")} />
            {subtitle && <Bone className="mt-2 h-3 w-44" />}
          </div>
          {action && <Bone className="h-3 w-14 shrink-0" />}
        </header>
      )}
      <div className={cn(!noPadding && dashboardCardPadding, bodyClassName)}>{children}</div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className={dashboardHeroSectionClass} aria-hidden="true">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <Bone className="h-3 w-40" />
          <Bone className="h-9 w-72 max-w-full sm:h-10" />
          <Bone className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[420px]">
          <Bone className="h-11 w-full rounded-xl sm:min-w-[320px] sm:flex-1" />
          <Bone className="h-11 w-full rounded-xl sm:w-28" />
        </div>
      </div>
    </section>
  );
}

function KpiStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex h-[112px] flex-col justify-between rounded-2xl px-5 py-4",
            i === 0
              ? "animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-700"
              : dashboardCardClass
          )}
        >
          <Bone className={cn("h-8 w-16", i === 0 && "bg-white/40 dark:bg-zinc-600/60")} />
          <Bone className={cn("h-4 w-24", i === 0 && "bg-white/30 dark:bg-zinc-600/50")} />
        </div>
      ))}
    </div>
  );
}

function BroadcastActivitySkeleton() {
  return (
    <section className={cn(dashboardCardClass, dashboardCardPadding, "h-fit w-full")} aria-hidden="true">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Bone className="h-4 w-36" />
          <Bone className="mt-2 h-3 w-52" />
        </div>
        <div>
          <Bone className="h-7 w-28" />
          <Bone className="mt-1 h-3 w-24" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-start gap-2.5">
          <div className="flex flex-col gap-[3px] pt-px">
            {Array.from({ length: HEATMAP_ROWS }).map((_, i) => (
              <Bone key={i} className={cn(CELL, "rounded-[4px] opacity-30")} />
            ))}
          </div>
          <div className="flex flex-1 gap-[3px] overflow-hidden pb-0.5">
            {Array.from({ length: HEATMAP_WEEKS }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {Array.from({ length: HEATMAP_ROWS }).map((_, dayIdx) => (
                  <Bone
                    key={dayIdx}
                    className={cn(CELL, "rounded-[4px]")}
                    style={{ opacity: 0.35 + ((weekIdx + dayIdx) % 5) * 0.12 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Bone className="h-2.5 w-6" />
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-[9px] w-[9px] rounded-[2px]" />
            ))}
          </div>
          <Bone className="h-2.5 w-6" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-zinc-700/60">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Bone className="h-2.5 w-16" />
            <Bone className="mt-1.5 h-3.5 w-full max-w-[88px]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveOperationsSkeleton() {
  return (
    <PanelShell
      title="Live Operations"
      subtitle
      action
      noPadding
      bodyClassName="px-5 py-4"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-100 p-5 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-3 w-24" />
              <Bone className="h-6 max-w-[280px] w-[85%]" />
              <Bone className="h-4 w-36" />
              <Bone className="h-3 w-28" />
            </div>
            <div className="flex h-8 items-end gap-[3px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <Bone
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{ height: 6 + (i % 4) * 5 }}
                />
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <Bone className="h-2.5 w-20" />
              <Bone className="h-2.5 w-16" />
            </div>
            <Bone className="h-1.5 w-full rounded-full" />
          </div>
        </div>

        <div>
          <Bone className="mb-2 h-2.5 w-32" />
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-zinc-800 dark:border-zinc-800">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Bone className="h-1.5 w-1.5 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-32" />
                  <Bone className="h-2.5 w-24" />
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <Bone className="ml-auto h-2.5 w-10" />
                  <Bone className="ml-auto h-2 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function ActivityTimelineSkeleton() {
  return (
    <PanelShell title="Recent Activity" subtitle noPadding bodyClassName="px-6 py-4">
      <ul className="divide-y divide-gray-100 dark:divide-zinc-700/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <Bone className="mt-0.5 h-7 w-7 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <Bone className="h-3.5 w-36" />
                <Bone className="h-2.5 w-10 shrink-0" />
              </div>
              <Bone className="mt-1.5 h-3 w-48 max-w-full" />
            </div>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function OperationsOverviewSkeleton() {
  return (
    <PanelShell title="Operations Overview" noPadding bodyClassName="p-0" className="self-start">
      <div className={cn("border-b border-gray-100 px-6 py-5 dark:border-zinc-800", dashboardMutedSurface)}>
        <div className="flex items-center gap-3">
          <Bone className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-44" />
            <Bone className="h-3.5 w-56 max-w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 dark:divide-zinc-800 dark:border-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-4 text-center">
            <Bone className="mx-auto h-6 w-8" />
            <Bone className="mx-auto mt-2 h-2.5 w-12" />
          </div>
        ))}
      </div>

      <div className="border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <Bone className="h-2.5 w-28" />
          <Bone className="h-3 w-14" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-3.5 w-12 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-3.5 w-full max-w-[180px]" />
                <Bone className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-4 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
    </PanelShell>
  );
}

function ScheduleSnapshotSkeleton() {
  return (
    <PanelShell
      title="Schedule Snapshot"
      subtitle
      action
      noPadding
      bodyClassName="px-4 py-3"
    >
      <ul className="relative space-y-1.5 pl-1">
        <div className="absolute bottom-2 left-[5px] top-2 w-px bg-gray-200 dark:bg-zinc-700" aria-hidden />
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className={cn("relative rounded-xl px-3 py-2.5 pl-5", dashboardMutedSurface)}>
            <Bone className="absolute left-0 top-1/2 h-2 w-2 -translate-x-[2px] -translate-y-1/2 rounded-full" />
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Bone className="h-3.5 w-14" />
                  <Bone className="h-4 w-14 rounded-md" />
                </div>
                <Bone className="mt-1.5 h-3.5 max-w-[200px] w-[85%]" />
                <Bone className="mt-1 h-2.5 w-28" />
              </div>
              <Bone className="h-2.5 w-8 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
      <Bone className="mt-3 h-2.5 w-40" />
    </PanelShell>
  );
}

function VenueInsightsSkeleton() {
  return (
    <PanelShell title="Venue Insights" subtitle className="self-start">
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn("p-3", dashboardMutedSurface)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Bone className="h-6 w-6 shrink-0 rounded-lg" />
                <Bone className="h-3.5 w-28" />
              </div>
              <Bone className="h-2.5 w-6 shrink-0" />
            </div>
            <Bone className="mt-1.5 h-2.5 w-48 max-w-full" />
            <Bone className="mt-2 h-1 w-full rounded-full" />
            <Bone className="mt-1.5 h-2.5 w-32" />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function PlayerInsightsSkeleton() {
  return (
    <PanelShell title="Player Insights" subtitle className="self-start">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={cn("p-4", dashboardMutedSurface)}>
            <div className="flex items-center gap-2">
              <Bone className="h-7 w-7 shrink-0 rounded-lg" />
              <Bone className="h-2.5 w-12" />
            </div>
            <Bone className="mt-2 h-8 w-10" />
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={cn("flex items-center gap-3 p-3", dashboardMutedSurface)}>
            <Bone className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bone className="h-2.5 w-28" />
              <Bone className="h-3.5 w-36 max-w-full" />
            </div>
          </div>
        ))}
      </div>

      <div className={cn("mt-4 flex items-center justify-between px-3 py-2", dashboardMutedSurface)}>
        <Bone className="h-3 w-20" />
        <Bone className="h-3.5 w-24" />
      </div>
    </PanelShell>
  );
}

function AudioInsightsSkeleton() {
  return (
    <PanelShell title="Audio Insights" subtitle className="self-start">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn("p-4", dashboardMutedSurface)}>
            <div className="flex items-center gap-2">
              <Bone className="h-7 w-7 shrink-0 rounded-lg" />
              <Bone className="h-2.5 w-20" />
            </div>
            <Bone className="mt-2 h-3.5 w-full max-w-[120px]" />
            <Bone className="mt-1.5 h-2.5 w-16" />
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        <HeroSkeleton />
        <KpiStripSkeleton />

        <div className={dashboardCommandLayout}>
          <div className={dashboardMainColumn}>
            <BroadcastActivitySkeleton />
            <LiveOperationsSkeleton />
            <ActivityTimelineSkeleton />
          </div>

          <aside className={dashboardSidebarColumn}>
            <OperationsOverviewSkeleton />
            <ScheduleSnapshotSkeleton />
            <VenueInsightsSkeleton />
          </aside>
        </div>

        <div className={dashboardHalfRow}>
          <PlayerInsightsSkeleton />
          <AudioInsightsSkeleton />
        </div>
      </div>
    </div>
  );
}
