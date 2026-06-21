import React from "react";
import {
  dashboardCardClass,
  dashboardContainerClass,
  dashboardHeroSectionClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import PlaylistsPagination from "@/app/library/playlists/components/PlaylistsPagination";
import { cn } from "@/utils/cn";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800", className)}
      aria-hidden
    />
  );
}

function PlayerRowSkeleton() {
  return (
    <div
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-zinc-800/80 sm:grid-cols-[36px_1fr_minmax(0,9rem)_minmax(0,7rem)_auto] sm:gap-4 sm:px-5"
      aria-hidden
    >
      <Bone className="h-8 w-8 rounded-lg" />
      <div className="min-w-0 space-y-1.5">
        <Bone className="h-3.5 w-[min(100%,180px)]" />
        <Bone className="h-3 w-[min(100%,140px)]" />
      </div>
      <Bone className="hidden h-3 w-16 sm:block" />
      <Bone className="hidden h-3 w-12 sm:block" />
      <div className="flex items-center justify-end gap-0.5">
        <Bone className="h-8 w-8 rounded-lg" />
        <Bone className="hidden h-8 w-8 rounded-lg sm:block" />
        <Bone className="hidden h-8 w-8 rounded-lg sm:block" />
        <Bone className="hidden h-8 w-8 rounded-lg sm:block" />
      </div>
    </div>
  );
}

function PlayersListHeaderSkeleton() {
  return (
    <div
      className="hidden border-b border-gray-100 px-5 py-2 dark:border-zinc-800 sm:grid sm:grid-cols-[36px_1fr_minmax(0,9rem)_minmax(0,7rem)_auto] sm:gap-4 sm:px-6"
      aria-hidden
    >
      <span />
      <Bone className="h-2.5 w-10" />
      <Bone className="h-2.5 w-14" />
      <Bone className="h-2.5 w-12" />
      <span />
    </div>
  );
}

export function PlayersListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      <PlayersListHeaderSkeleton />
      {Array.from({ length: count }).map((_, i) => (
        <PlayerRowSkeleton key={i} />
      ))}
    </>
  );
}

export function PlayersListPanelSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={cn(dashboardCardClass, "overflow-hidden")}>
      <PlayersListSkeleton count={count} />
    </div>
  );
}

export function PlayersToolbarSkeleton({
  showWorkspace = false,
}: {
  showWorkspace?: boolean;
}) {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Bone className="h-3 w-8" />
          <Bone className="h-8 w-12 rounded-lg" />
          <Bone className="h-8 w-14 rounded-lg" />
          <Bone className="h-8 w-14 rounded-lg" />
          <Bone className="h-8 w-12 rounded-lg" />
          <Bone className="h-8 w-16 rounded-lg" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showWorkspace ? (
            <Bone className="h-10 w-full min-w-[180px] flex-1 rounded-xl sm:max-w-[220px] sm:flex-none" />
          ) : null}
          <Bone className="h-10 w-full min-w-[160px] flex-1 rounded-xl sm:w-[180px] sm:flex-none" />
          <Bone className="h-10 w-10 shrink-0 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function PlayersResultsSummarySkeleton() {
  return (
    <div className="flex justify-end" aria-hidden>
      <Bone className="h-4 w-48" />
    </div>
  );
}

export function PlayersWorkspaceHeadingSkeleton() {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1 pb-2" aria-hidden>
      <Bone className="h-4 w-40" />
      <Bone className="h-3 w-16" />
    </div>
  );
}

export function PlayersHeroSkeleton() {
  return (
    <header className={dashboardHeroSectionClass}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-pulse space-y-1.5">
          <Bone className="h-3 w-32" />
          <Bone className="h-9 w-36 sm:h-10" />
          <Bone className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[420px] lg:w-auto">
          <Bone className="h-11 flex-1 rounded-xl" />
          <Bone className="h-11 w-full rounded-xl sm:w-36" />
        </div>
      </div>
    </header>
  );
}

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

type PlayersPageSkeletonProps = {
  perPage?: number;
  page?: number;
  totalPages?: number;
  showWorkspace?: boolean;
};

export default function PlayersPageSkeleton({
  perPage = 5,
  page = 1,
  totalPages = 1,
  showWorkspace = true,
}: PlayersPageSkeletonProps) {
  return (
    <div className={dashboardPageClass} aria-busy="true" aria-label="Loading players">
      <div className={dashboardContainerClass}>
        <PlayersHeroSkeleton />
        <PlayersToolbarSkeleton showWorkspace={showWorkspace} />
        <PlayersResultsSummarySkeleton />
        <div className="space-y-6">
          <PlayersWorkspaceHeadingSkeleton />
          <PlayersListPanelSkeleton count={perPage} />
        </div>
        <PlaylistsPagination
          page={page}
          setPage={() => {}}
          perPage={perPage}
          setPerPage={() => {}}
          perPageOptions={PER_PAGE_OPTIONS}
          totalPages={Math.max(1, totalPages)}
          disabled
          showTopBorder={false}
          ariaLabel="Player pagination"
        />
      </div>
    </div>
  );
}
