import React from "react";
import { cn } from "@/utils/cn";
import {
  dashboardCardClass,
  dashboardCommandLayout,
  dashboardMainColumn,
  dashboardSidebarColumn,
} from "@/app/dashboard/dashboard-styles";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800", className)}
      aria-hidden="true"
    />
  );
}

export default function PlaylistDetailSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <Bone className="h-4 w-20" />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-5">
          <Bone className="h-[72px] w-[72px] shrink-0 rounded-xl" />
          <div className="space-y-2 pt-0.5">
            <Bone className="h-3 w-36" />
            <Bone className="h-8 w-56 max-w-full" />
            <Bone className="h-4 w-64 max-w-full" />
            <Bone className="h-3 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 w-28 rounded-xl" />
          <Bone className="h-10 w-20 rounded-xl" />
          <Bone className="h-10 w-20 rounded-xl" />
        </div>
      </div>

      <div className={dashboardCommandLayout}>
        <section className={cn(dashboardCardClass, "overflow-hidden", dashboardMainColumn)}>
          <div className="border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
            <Bone className="h-4 w-16" />
            <Bone className="mt-1 h-3 w-24" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="mx-5 my-3 h-11 rounded-lg" />
            ))}
          </div>
        </section>
        <div className={cn(dashboardSidebarColumn, "space-y-4")}>
          <Bone className="h-36 w-full rounded-2xl" />
          <Bone className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
