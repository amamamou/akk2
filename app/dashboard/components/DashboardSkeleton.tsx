import React from "react";
import {
  dashboardCardClass,
  dashboardCommandLayout,
  dashboardContainerClass,
  dashboardHalfRow,
  dashboardHeroSectionClass,
  dashboardMainColumn,
  dashboardPageClass,
  dashboardSidebarColumn,
} from "../dashboard-styles";

function Bone({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-100 dark:bg-zinc-800 ${className}`}
      aria-hidden="true"
    />
  );
}

function PanelSkeleton({
  titleWidth = "w-32",
  children,
  className = "",
}: {
  titleWidth?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`self-start overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-zinc-700/60 dark:bg-zinc-900 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-zinc-700/60">
        <div>
          <Bone className={`h-4 ${titleWidth}`} />
          <Bone className="mt-2 h-3 w-40" />
        </div>
        <Bone className="h-3 w-14" />
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function KpiSkeleton({ highlight }: { highlight?: boolean }) {
  return (
    <div
      className={[
        "flex h-[112px] animate-pulse flex-col justify-between rounded-2xl px-5 py-4",
        highlight
          ? "bg-gray-300 dark:bg-zinc-700"
          : `${dashboardCardClass} bg-gray-50 dark:bg-zinc-800/80`,
      ].join(" ")}
      aria-hidden="true"
    >
      <Bone className={`h-8 w-16 ${highlight ? "bg-white/30" : ""}`} />
      <Bone className={`h-4 w-24 ${highlight ? "bg-white/20" : ""}`} />
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        {/* Hero — no divider */}
        <div className={dashboardHeroSectionClass}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Bone className="h-3 w-36" />
              <Bone className="h-9 w-72 max-w-full" />
              <Bone className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-md">
              <Bone className="h-11 flex-1 rounded-xl" />
              <Bone className="h-11 w-28 rounded-xl" />
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KpiSkeleton highlight />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>

        {/* 8/4 command layout */}
        <div className={dashboardCommandLayout}>
          <div className={dashboardMainColumn}>
            <PanelSkeleton titleWidth="w-40" className="min-h-[320px]">
              <Bone className="mb-5 h-10 w-24 rounded-xl" />
              <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
                {Array.from({ length: 49 }).map((_, i) => (
                  <Bone key={i} className="h-[13px] w-[13px] rounded-sm" />
                ))}
              </div>
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-36" className="min-h-[320px]">
              <Bone className="mb-4 h-44 w-full rounded-2xl" />
              <Bone className="mb-2 h-3 w-28" />
              {Array.from({ length: 2 }).map((_, i) => (
                <Bone key={i} className="mb-2 h-11 w-full rounded-xl" />
              ))}
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-36" className="min-h-[220px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 border-t border-gray-50 py-3 dark:border-zinc-800">
                  <Bone className="h-7 w-7 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Bone className="h-3.5 w-32" />
                    <Bone className="h-3 w-full max-w-[200px]" />
                  </div>
                </div>
              ))}
            </PanelSkeleton>
          </div>

          <aside className={dashboardSidebarColumn}>
            <PanelSkeleton titleWidth="w-40" className="min-h-[240px]">
              <Bone className="mb-4 h-16 w-full rounded-xl" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Bone key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-36" className="min-h-[240px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className="mb-2 h-16 w-full rounded-xl" />
              ))}
            </PanelSkeleton>

            <PanelSkeleton titleWidth="w-28" className="min-h-[200px]">
              {Array.from({ length: 3 }).map((_, i) => (
                <Bone key={i} className="mb-2 h-14 w-full rounded-xl" />
              ))}
            </PanelSkeleton>
          </aside>
        </div>

        {/* Bottom row */}
        <div className={dashboardHalfRow}>
          <PanelSkeleton titleWidth="w-28" className="min-h-[160px]">
            <div className="grid grid-cols-3 gap-3">
              <Bone className="h-16 rounded-xl" />
              <Bone className="h-16 rounded-xl" />
              <Bone className="h-16 rounded-xl" />
            </div>
          </PanelSkeleton>
          <PanelSkeleton titleWidth="w-32" className="min-h-[160px]">
            <div className="grid grid-cols-2 gap-3">
              <Bone className="h-16 rounded-xl" />
              <Bone className="h-16 rounded-xl" />
            </div>
          </PanelSkeleton>
        </div>
      </div>
    </div>
  );
}
