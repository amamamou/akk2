import React from "react";
import { cn } from "@/utils/cn";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800", className)}
      aria-hidden="true"
    />
  );
}

export default function PlaylistCardSkeleton() {
  return (
    <div className="flex w-full flex-col" aria-hidden="true">
      <Bone className="aspect-square w-full rounded-2xl" />
      <Bone className="mt-3 h-4 max-w-[140px] w-[85%]" />
      <Bone className="mt-1.5 h-3 w-20" />
    </div>
  );
}

export function PlaylistGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <PlaylistCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PlaylistsResultsSummarySkeleton() {
  return (
    <div className="flex justify-end" aria-hidden>
      <Bone className="h-4 w-48" />
    </div>
  );
}
