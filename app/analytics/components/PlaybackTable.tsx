"use client";

import React from "react";
import { cn } from "@/utils/cn";
import type { PlaybackLogEntry } from "@/types/api";
import {
  ENGAGEMENT_TIER_META,
  resolveEngagementTier,
  type EngagementTier,
} from "@/lib/analytics-metrics";

export default function PlaybackTable({
  filteredLogs,
  resolveMediaLabel,
  resolveDeviceLabel,
  logIconForStatus,
  isEngagementTier,
  tierDisplayLabel,
  tierChipClass,
  formatDuration,
  formatLogTime,
}: {
  filteredLogs: PlaybackLogEntry[];
  resolveMediaLabel: (id: string | null | undefined, title?: string | null) => string;
  resolveDeviceLabel: (id: string | null | undefined, name?: string | null) => string;
  logIconForStatus: (status: string, durationSeconds?: number | null) => unknown;
  isEngagementTier: (s: string) => boolean;
  tierDisplayLabel: (s: string) => string;
  tierChipClass: (s: string, durationSeconds?: number | null) => string;
  formatDuration: (seconds: number | null | undefined) => string;
  formatLogTime: (iso: string | null | undefined) => string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-800/80 dark:to-zinc-800/50 border-b border-gray-100 dark:border-zinc-700/60">
        <h3 className="text-sm font-semibold text-gray-950 dark:text-zinc-100">Playback Verification</h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Recent broadcast activity classified by listen duration
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/60">
            <tr>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">File</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Device</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Latency</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Duration</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Quality</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Session</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 dark:text-zinc-300 text-xs uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500 dark:text-zinc-400 text-sm">
                  No playback logs for this filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const resolved = resolveEngagementTier(log.durationSeconds, log.status);
                const hasTierStatus = resolved != null || isEngagementTier(log.status);
                const tier: EngagementTier | null = resolved;
                const label = tier
                  ? `${ENGAGEMENT_TIER_META[tier].label} (${ENGAGEMENT_TIER_META[tier].description})`
                  : tierDisplayLabel(log.status);
                const Icon = logIconForStatus(log.status, log.durationSeconds);
                const IconComp = Icon as React.ElementType;
                const statusUpper = log.status.toUpperCase();
                const isCompleted =
                  tier === "DEEP" ||
                  tier === "STARTED" ||
                  tier === "MODERATE" ||
                  tier === "LIGHT" ||
                  statusUpper === "COMPLETED" ||
                  statusUpper === "ENGAGED";
                const isPlaying = tier === "STARTED" || tier === "MODERATE" || statusUpper === "STARTED";
                return (
                  <tr
                    key={log.id}
                    className="border-b border-gray-50 dark:border-zinc-700/40 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                            isCompleted
                              ? "bg-emerald-100"
                              : isPlaying
                                ? "bg-blue-50"
                                : "bg-red-50"
                          )}
                        >
                          <IconComp
                            size={14}
                            className={cn(
                              isCompleted
                                ? "text-emerald-700"
                                : isPlaying
                                  ? "text-blue-600"
                                  : "text-red-600"
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-zinc-100 text-sm">
                            {resolveMediaLabel(log.mediaId, log.mediaTitle)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {resolveDeviceLabel(log.playerId, log.playerName)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-gray-700 text-xs font-medium">
                        {resolveDeviceLabel(log.playerId, log.playerName)}
                      </p>
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                          tierChipClass(log.status, log.durationSeconds)
                        )}
                      >
                        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                        {hasTierStatus
                          ? label
                          : statusUpper === "COMPLETED"
                            ? "Successful"
                            : label}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-gray-600 text-xs font-mono">—</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-gray-600 text-xs">{formatDuration(log.durationSeconds)}</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                          tier
                            ? tierChipClass(log.status, log.durationSeconds)
                            : "text-gray-600"
                        )}
                      >
                        {tier
                          ? ENGAGEMENT_TIER_META[tier].label
                          : (log.durationSeconds ?? 0) >= 600
                            ? "HD"
                            : "SD"}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-gray-500 text-xs font-mono">{log.id.slice(0, 12)}</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-gray-600 text-xs whitespace-nowrap">
                        {formatLogTime(log.startedAt || log.createdAt)}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
