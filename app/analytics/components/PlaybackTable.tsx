"use client";

import React from "react";
import { cn } from "@/utils/cn";
import type { PlaybackLogEntry } from "@/types/api";

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
  logIconForStatus: (status: string) => unknown;
  isEngagementTier: (s: string) => boolean;
  tierDisplayLabel: (s: string) => string;
  tierChipClass: (s: string) => string;
  formatDuration: (seconds: number | null | undefined) => string;
  formatLogTime: (iso: string | null | undefined) => string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-sm font-semibold text-gray-950">Playback Verification</h3>
        <p className="text-xs text-gray-500 mt-0.5">Recent broadcast activity and performance metrics</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">File</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Device</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Latency</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Duration</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Quality</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Session</th>
              <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-500 text-sm">No playback logs for this filter.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const tier = isEngagementTier(log.status);
                const label = tier ? tierDisplayLabel(log.status) : log.status;
                const Icon = logIconForStatus(log.status);
                const IconComp = Icon as React.ElementType;
                const statusUpper = log.status.toUpperCase();
                const isCompleted = statusUpper === "COMPLETED" || statusUpper === "DEEP" || statusUpper === "ENGAGED";
                const isPlaying = statusUpper === "STARTED" || statusUpper === "MODERATE";
                return (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                          isCompleted ? "bg-emerald-100" : isPlaying ? "bg-blue-50" : "bg-red-50"
                        )}>
                          <IconComp size={14} className={cn(isCompleted ? "text-emerald-700" : isPlaying ? "text-blue-600" : "text-red-600")} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{resolveMediaLabel(log.mediaId, log.mediaTitle)}</p>
                          <p className="text-xs text-gray-500">{resolveDeviceLabel(log.playerId, log.playerName)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-gray-700 text-xs font-medium">{resolveDeviceLabel(log.playerId, log.playerName)}</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", tierChipClass(log.status))}>
                        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                        {tier ? label : statusUpper === "COMPLETED" ? "Successful" : label}
                      </span>
                    </td>
                    <td className="px-5 py-2.5"><p className="text-gray-600 text-xs font-mono">—</p></td>
                    <td className="px-5 py-2.5"><p className="text-gray-600 text-xs">{formatDuration(log.durationSeconds)}</p></td>
                    <td className="px-5 py-2.5">
                      <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", tier ? tierChipClass(log.status) : "text-gray-600")}>{tier ? label : (log.durationSeconds ?? 0) >= 600 ? "HD" : "SD"}</span>
                    </td>
                    <td className="px-5 py-2.5"><p className="text-gray-500 text-xs font-mono">{log.id.slice(0, 12)}</p></td>
                    <td className="px-5 py-2.5"><p className="text-gray-600 text-xs whitespace-nowrap">{formatLogTime(log.startedAt || log.createdAt)}</p></td>
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
