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
      className={cn("rounded-md bg-gray-200 dark:bg-zinc-800", className)}
      aria-hidden
    />
  );
}

function TabBarSkeleton() {
  return (
    <div
      className="flex gap-7 border-b border-gray-100/90 px-6 py-3.5 dark:border-zinc-800/80 sm:gap-9 sm:px-8"
      aria-hidden
    >
      <Bone className="h-5 w-[5.5rem]" />
      <Bone className="h-5 w-12" />
      <Bone className="h-5 w-14" />
    </div>
  );
}

function MyDetailsContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Bone className="h-6 w-48" />
        <Bone className="h-4 w-full max-w-md" />
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Bone className="mx-auto h-[88px] w-[88px] shrink-0 rounded-full sm:mx-0" />
        <div className="flex flex-1 flex-col items-center space-y-2 sm:items-start">
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-52" />
          <Bone className="h-3 w-24" />
          <Bone className="mt-2 h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="space-y-6">
        <Bone className="h-3 w-16" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-4 w-24" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 border-t border-gray-100 pt-8 dark:border-zinc-800">
        <Bone className="h-3 w-20" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-4 w-20" />
              <Bone className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 dark:border-zinc-800 sm:flex-row sm:justify-end">
        <Bone className="h-10 w-full rounded-xl sm:w-24" />
        <Bone className="h-10 w-full rounded-xl sm:w-28" />
      </div>
    </div>
  );
}

export default function SettingsPageSkeleton() {
  return (
    <div className={dashboardPageClass} aria-busy="true" aria-label="Loading settings">
      <div className={cn(dashboardContainerClass, "animate-pulse")}>
        <header className={dashboardHeroSectionClass}>
          <div className="space-y-3">
            <Bone className="h-3 w-36" />
            <Bone className="h-9 w-44 sm:h-10" />
            <Bone className="h-4 w-80 max-w-full" />
          </div>
        </header>

        <div
          className={cn(
            dashboardCardClass,
            "flex min-h-[calc(100vh-14rem)] flex-col overflow-hidden"
          )}
        >
          <TabBarSkeleton />
          <div className="flex-1 p-6 sm:p-8">
            <MyDetailsContentSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
