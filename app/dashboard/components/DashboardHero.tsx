"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Search, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import type { MediaInfo, PlayerInfo, ScheduleEntry } from "@/types/api";
import { searchDashboard, type DashboardSearchResult } from "@/lib/dashboard-search";
import {
  dashboardHeroSectionClass,
  dashboardLinkAction,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

type StoredUser = { name?: string; email?: string };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const typeLabels: Record<DashboardSearchResult["type"], string> = {
  player: "Player",
  venue: "Venue",
  schedule: "Schedule",
  media: "Audio",
};

interface DashboardHeroProps {
  players: PlayerInfo[];
  schedules: ScheduleEntry[];
  media: MediaInfo[];
}

export default function DashboardHero({ players, schedules, media }: DashboardHeroProps) {
  const { user } = useAuth();
  const u = user as StoredUser | undefined;
  const displayName = u?.name || u?.email?.split("@")[0] || "there";
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className={dashboardHeroSectionClass}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
            {dateLabel}
          </p>
          <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
            {getGreeting()}, {displayName}
          </h1>
          <p className={cn(dashboardPanelSubtitle, "max-w-xl text-sm")}>
            Monitor broadcasts, players, and schedules across your platform.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[420px]">
          <DashboardSearch players={players} schedules={schedules} media={media} />
          <Link
            href="/schedule"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <CalendarDays size={15} strokeWidth={1.9} className="text-gray-400" />
            Schedule
          </Link>
        </div>
      </div>
    </section>
  );
}

function DashboardSearch({
  players,
  schedules,
  media,
}: {
  players: PlayerInfo[];
  schedules: ScheduleEntry[];
  media: MediaInfo[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => searchDashboard(query, players, schedules, media),
    [query, players, schedules, media]
  );

  return (
    <div ref={containerRef} className="relative w-full sm:min-w-[320px] sm:flex-1">
      <Search
        size={15}
        strokeWidth={1.9}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            setOpen(false);
          }
          if (e.key === "Enter" && results[0]) {
            router.push(results[0].href);
            setOpen(false);
          }
        }}
        aria-label="Search dashboard"
        aria-expanded={open && results.length > 0}
        placeholder="Search players, venues, schedules, audio…"
        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      ) : null}

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:border-zinc-700 dark:bg-zinc-900">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-950 dark:text-zinc-100">
                        {result.label}
                      </p>
                      <p className="truncate text-xs text-gray-500">{result.meta}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      {typeLabels[result.type]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
