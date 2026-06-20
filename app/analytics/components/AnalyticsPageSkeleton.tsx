import React from "react";

export default function AnalyticsPageSkeleton() {
  return (
    <>
      <div>
        <div className="grid grid-cols-2 gap-4 animate-pulse sm:grid-cols-4">
          <div
            className="h-20 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
            aria-hidden
          />
          <div
            className="h-20 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
            aria-hidden
          />
          <div
            className="h-20 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
            aria-hidden
          />
          <div
            className="h-20 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
            aria-hidden
          />
        </div>
      </div>

      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div
              className="h-40 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
              aria-hidden
            />
            <div
              className="h-60 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
              aria-hidden
            />
          </div>

          <div className="space-y-6">
            <div
              className="h-24 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
              aria-hidden
            />
            <div
              className="h-40 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
              aria-hidden
            />
            <div
              className="h-20 rounded-2xl border border-gray-200 bg-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </>
  );
}
