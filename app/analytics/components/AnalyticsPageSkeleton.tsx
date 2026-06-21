import React from "react";
import {
  dashboardHeroSectionClass,
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

function AnalyticsHeroSkeleton() {
  return (
    <section className={dashboardHeroSectionClass}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <Bone className="h-3 w-44" />
          <Bone className="h-9 w-36 sm:h-10" />
          <Bone className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex w-full flex-col gap-2 lg:min-w-[320px] lg:items-end">
          <Bone className="h-3 w-12 lg:ml-auto" />
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Bone className="h-7 w-16 rounded-lg" />
            <Bone className="h-7 w-24 rounded-lg" />
            <Bone className="h-7 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AnalyticsPageSkeleton() {
  return (
    <>
      <AnalyticsHeroSkeleton />

      <div className="animate-pulse space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Bone className="h-3 w-12" />
          <Bone className="h-10 w-[200px] rounded-xl" />
          <Bone className="ml-1 h-3 w-12" />
          <Bone className="h-10 w-[200px] rounded-xl" />
        </div>
      </div>

      <div className="animate-pulse">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-none"
              aria-hidden
            />
          ))}
        </div>
      </div>

      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-40 rounded-2xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-none" aria-hidden />
            <div className="h-60 rounded-2xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-none" aria-hidden />
          </div>

          <div className="space-y-6">
            <div className="h-24 rounded-2xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-none" aria-hidden />
            <div className="h-40 rounded-2xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-none" aria-hidden />
            <div className="h-20 rounded-2xl bg-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-none" aria-hidden />
          </div>
        </div>
      </div>
    </>
  );
}
