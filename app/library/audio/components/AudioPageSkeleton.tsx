import React from "react";
import { cn } from "@/utils/cn";
import { dashboardCardClass } from "@/app/dashboard/dashboard-styles";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800", className)}
      aria-hidden
    />
  );
}

function AudioListRowSkeleton() {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-zinc-800/80 sm:grid-cols-[36px_1fr_64px_72px_72px] sm:gap-4 sm:px-5"
      )}
    >
      <Bone className="h-8 w-8 rounded-lg" />
      <div className="min-w-0 space-y-1.5">
        <Bone className="h-3.5 w-[min(100%,220px)]" />
        <Bone className="h-3 w-[min(100%,140px)]" />
      </div>
      <Bone className="hidden h-3 w-10 justify-self-end sm:block" />
      <Bone className="hidden h-3 w-10 justify-self-end sm:block" />
      <Bone className="h-8 w-16 justify-self-end rounded-lg" />
    </div>
  );
}

export function AudioListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div>
      <div className="hidden border-b border-gray-100 px-5 py-2 dark:border-zinc-800 sm:grid sm:grid-cols-[36px_1fr_64px_72px_72px] sm:gap-4 sm:px-6">
        <span />
        <Bone className="h-2.5 w-8" />
        <Bone className="h-2.5 w-14 justify-self-end" />
        <Bone className="h-2.5 w-8 justify-self-end" />
        <span />
      </div>
      <div className="relative">
        {Array.from({ length: count }).map((_, i) => (
          <AudioListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function AudioHeroSkeleton() {
  return (
    <section className="pb-1">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <Bone className="h-3 w-36" />
          <Bone className="h-9 w-32 sm:h-10" />
          <Bone className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[420px] lg:w-auto">
          <Bone className="h-11 w-full flex-1 rounded-xl" />
          <Bone className="h-11 w-full shrink-0 rounded-xl sm:w-[140px]" />
        </div>
      </div>
    </section>
  );
}

function AudioToolbarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Bone className="h-3 w-14" />
          <Bone className="h-10 w-full min-w-[160px] flex-1 rounded-xl sm:w-[180px] sm:flex-none" />
          <Bone className="ml-1 h-3 w-12" />
          <Bone className="h-10 w-full min-w-[160px] flex-1 rounded-xl sm:w-[180px] sm:flex-none" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-10 w-full min-w-[160px] flex-1 rounded-xl sm:w-[180px] sm:flex-none" />
          <Bone className="h-10 w-10 shrink-0 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function AudioResultsSummarySkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Bone className="h-4 w-4 rounded" />
      <Bone className="h-4 w-48" />
    </div>
  );
}

function AudioPaginationSkeleton() {
  return (
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
  );
}

export default function AudioPageSkeleton({ perPage = 10 }: { perPage?: number }) {
  return (
    <>
      <AudioHeroSkeleton />
      <AudioToolbarSkeleton />
      <AudioResultsSummarySkeleton />
      <section className={cn(dashboardCardClass, "overflow-hidden")}>
        <AudioListSkeleton count={perPage} />
      </section>
      <AudioPaginationSkeleton />
    </>
  );
}
