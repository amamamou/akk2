import React from "react";
import {
  dashboardCardClass,
  dashboardContainerClass,
  dashboardHeroSectionClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800", className)}
      aria-hidden
    />
  );
}

function ClientCardSkeleton() {
  return (
    <div className={cn(dashboardCardClass, "overflow-hidden")} aria-hidden>
      <div className="flex items-start gap-3 p-5 pb-4">
        <Bone className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-5 w-40" />
          <Bone className="h-4 w-28" />
          <Bone className="h-3 w-24" />
        </div>
      </div>
      <div className="border-t border-gray-100 px-5 py-4 dark:border-zinc-800">
        <div className="grid grid-cols-3 gap-4">
          <Bone className="h-10 w-full" />
          <Bone className="h-10 w-full" />
          <Bone className="h-10 w-full" />
        </div>
      </div>
      <div className="border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
        <Bone className="h-4 w-48" />
      </div>
      <div className="border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
        <div className="flex justify-between gap-4">
          <Bone className="h-8 w-36" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ClientsPageSkeleton() {
  return (
    <div className={dashboardPageClass} aria-busy="true" aria-label="Loading clients">
      <div className={dashboardContainerClass}>
        <header className={dashboardHeroSectionClass}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="animate-pulse space-y-3">
              <Bone className="h-3 w-44" />
              <Bone className="h-9 w-36 sm:h-10" />
              <Bone className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[420px] lg:w-auto">
              <Bone className="h-11 flex-1 rounded-xl" />
              <Bone className="h-11 w-full rounded-xl sm:w-36" />
            </div>
          </div>
        </header>

        <div className="animate-pulse space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Bone className="h-3 w-10" />
              <Bone className="h-7 w-14 rounded-lg" />
              <Bone className="h-7 w-16 rounded-lg" />
              <Bone className="h-7 w-16 rounded-lg" />
              <Bone className="h-7 w-14 rounded-lg" />
              <Bone className="ml-1 h-3 w-20" />
              <Bone className="h-7 w-[72px] rounded-lg" />
              <Bone className="h-7 w-16 rounded-lg" />
              <Bone className="h-7 w-16 rounded-lg" />
              <Bone className="h-7 w-20 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <Bone className="h-10 w-[180px] rounded-xl" />
              <Bone className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="flex justify-end" aria-hidden>
          <Bone className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ClientCardSkeleton key={i} />
          ))}
        </div>

        <div
          className="flex min-h-[52px] flex-col items-center justify-between gap-3 sm:flex-row"
          aria-hidden
        >
          <div className="flex items-center gap-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-16 rounded-lg" />
          </div>
          <div className="flex items-center gap-1.5">
            <Bone className="h-9 w-[88px] rounded-lg" />
            <Bone className="h-4 w-24" />
            <Bone className="h-9 w-[72px] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
