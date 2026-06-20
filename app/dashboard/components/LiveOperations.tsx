"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Headphones, Radio, Signal, Waves } from "lucide-react";
import DashboardPanel from "./DashboardPanel";
import DashboardStatusDot from "./DashboardStatusDot";
import type { LivePlayerRow } from "@/lib/dashboard-insights";
import {
  dashboardAccentProgress,
  dashboardAccentProgressGlow,
  dashboardAccentProgressTrack,
  dashboardLinkAction,
  dashboardMetricValue,
  dashboardMutedSurface,
  statusOkText,
  statusWarnText,
} from "../dashboard-styles";
import { cn } from "@/utils/cn";

const BAR_COUNT = 16;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

function formatRecency(iso: string | null): string {
  if (!iso) return "—";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function isPlayingRow(player: LivePlayerRow): boolean {
  return player.isPlaying && player.currentTrack !== "Idle";
}

function Equalizer({ size = "hero" }: { size?: "hero" | "sm" }) {
  const barW = size === "hero" ? "w-[3px]" : "w-[2px]";
  const maxH = size === "hero" ? 32 : 14;

  return (
    <div
      className={cn("flex items-end gap-[3px]", size === "hero" ? "h-8" : "h-3.5")}
      aria-hidden
    >
      {Array.from({ length: size === "hero" ? BAR_COUNT : 8 }).map((_, i) => (
        <motion.span
          key={i}
          className={cn(
            barW,
            "rounded-full bg-gradient-to-t from-[#7C3AED] via-[#A473FF] to-[#C59DFF]"
          )}
          animate={{
            height: [4, 4 + ((i % 6) + 2) * (maxH / 8), 4],
            opacity: [0.65, 1, 0.65],
          }}
          transition={{
            duration: 0.5 + (i % 5) * 0.07,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.035,
          }}
          style={{ height: 4 }}
        />
      ))}
    </div>
  );
}

function NowPlayingHero({ player }: { player: LivePlayerRow }) {
  const [progress, setProgress] = useState(player.progress);
  const duration = player.duration > 0 ? player.duration : 180;
  const pct = Math.min(100, (progress / duration) * 100);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => Math.min(duration, p + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [duration]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#A473FF]/15 bg-white p-5",
        "shadow-[0_8px_32px_rgba(164,115,255,0.12)] dark:bg-zinc-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#A473FF]/50 before:to-transparent"
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#A473FF]/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Radio size={9} strokeWidth={2.5} />
              Live
            </span>
          </div>

          <p className="mt-3 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            <Headphones size={11} strokeWidth={2} className="text-[#A473FF]/70" />
            Now playing
          </p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight text-gray-950 dark:text-zinc-50">
            {player.currentTrack}
          </p>

          <div className="mt-3">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-200">
              {player.location}
            </p>
            <p className="truncate text-xs text-gray-400">{player.playerName}</p>
          </div>
        </div>

        <Equalizer size="hero" />
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between text-[10px] tabular-nums text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Waves size={10} strokeWidth={2} className="text-[#A473FF]/60" />
            Broadcasting
          </span>
          <span>
            {formatClock(progress)} / {formatClock(duration)}
          </span>
        </div>
        <div className={cn("h-1.5 overflow-hidden rounded-full", dashboardAccentProgressTrack)}>
          <motion.div
            className={cn("h-full rounded-full", dashboardAccentProgress, dashboardAccentProgressGlow)}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
          />
        </div>
      </div>
    </motion.article>
  );
}

function OnlinePlayerRow({ player, compact }: { player: LivePlayerRow; compact?: boolean }) {
  const playing = isPlayingRow(player);
  const statusClass = player.health === "degraded" ? statusWarnText : statusOkText;
  const statusText = player.health === "degraded" ? "Stale heartbeat" : "Online";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/40",
        compact && "py-2"
      )}
    >
      <DashboardStatusDot
        variant={playing ? "playing" : player.health === "degraded" ? "warning" : "online"}
        pulse
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", dashboardMetricValue)}>
          {player.location}
        </p>
        <p className="truncate text-[11px] text-gray-400">
          {playing ? player.currentTrack : player.playerName}
        </p>
      </div>
      {playing ? (
        <Equalizer size="sm" />
      ) : (
        <div className="shrink-0 text-right">
          <p className={cn("text-[11px] font-medium", statusClass)}>{statusText}</p>
          <p className="text-[10px] tabular-nums text-gray-400">{formatRecency(player.lastHeartbeat)}</p>
        </div>
      )}
    </div>
  );
}

function sortOnline(players: LivePlayerRow[]): LivePlayerRow[] {
  return [...players].sort((a, b) => {
    const rank = (p: LivePlayerRow) => (isPlayingRow(p) ? 0 : 1);
    return rank(a) - rank(b) || a.location.localeCompare(b.location);
  });
}

export default function LiveOperations({ players }: { players: LivePlayerRow[] }) {
  const online = useMemo(
    () => sortOnline(players.filter((p) => p.status === "online")),
    [players]
  );

  const hero = online.find(isPlayingRow) ?? null;
  const alsoPlaying = online.filter((p) => isPlayingRow(p) && p.id !== hero?.id);
  const standby = online.filter((p) => !isPlayingRow(p));

  return (
    <DashboardPanel
      className="h-fit w-full"
      title="Live Operations"
      subtitle={
        hero
          ? "Broadcasting now"
          : online.length > 0
            ? `${online.length} player${online.length > 1 ? "s" : ""} online`
            : "No players connected"
      }
      action={
        <Link href="/players" className={dashboardLinkAction}>
          View all
        </Link>
      }
      noPadding
      bodyClassName="px-5 py-4"
    >
      {online.length === 0 ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-4 py-8 dark:border-zinc-700",
            dashboardMutedSurface
          )}
        >
          <Radio size={18} className="text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">No players online</p>
            <p className="text-xs text-gray-400">Connected players will appear here in real time</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {hero ? (
            <NowPlayingHero player={hero} />
          ) : (
            <div className={cn("rounded-xl px-4 py-5 text-center", dashboardMutedSurface)}>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">No active broadcast</p>
              <p className="mt-1 text-xs text-gray-400">
                {online.length} player{online.length > 1 ? "s" : ""} connected and standing by
              </p>
            </div>
          )}

          {alsoPlaying.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 px-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                <Radio size={10} strokeWidth={2} className="text-[#A473FF]/60" />
                Also broadcasting
              </p>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-zinc-800 dark:border-zinc-800">
                {alsoPlaying.map((player) => (
                  <OnlinePlayerRow key={player.id} player={player} compact />
                ))}
              </div>
            </div>
          )}

          {standby.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 px-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                <Signal size={10} strokeWidth={2} className="text-gray-400" />
                Online · standing by
              </p>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-zinc-800 dark:border-zinc-800">
                {standby.map((player) => (
                  <OnlinePlayerRow key={player.id} player={player} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardPanel>
  );
}
