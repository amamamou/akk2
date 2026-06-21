"use client";

import React from "react";
import { Radio, Users } from "lucide-react";
import { dashboardMutedSurface, dashboardSectionLabel } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import type { PlayerInfo } from "@/types/api";
import type { WorkspaceClientOption } from "@/lib/workspace-clients";

const filterSelectClass =
  "h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white py-0 pl-9 pr-8 text-sm text-gray-700 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

interface AnalyticsToolbarProps {
  isSuperAdmin: boolean;
  workspaceSelectOptions: WorkspaceClientOption[];
  selectedWorkspaceClientId: string;
  onWorkspaceClientChange: (clientId: string) => void;
  selectedPlayerId: string;
  onPlayerChange: (playerId: string) => void;
  playerOptions: PlayerInfo[];
  resolveDeviceLabel: (playerId: string, apiName?: string | null) => string;
  selectedPlayerMeta: {
    status: "online" | "offline";
    device: string;
    lastActive: string;
  };
}

export default function AnalyticsToolbar({
  isSuperAdmin,
  workspaceSelectOptions,
  selectedWorkspaceClientId,
  onWorkspaceClientChange,
  selectedPlayerId,
  onPlayerChange,
  playerOptions,
  resolveDeviceLabel,
  selectedPlayerMeta,
}: AnalyticsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && workspaceSelectOptions.length > 0 && (
            <>
              <span className={cn("mr-0.5", dashboardSectionLabel)}>Client</span>
              <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[200px]">
                <Users
                  size={14}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  value={selectedWorkspaceClientId}
                  onChange={(e) => onWorkspaceClientChange(e.target.value)}
                  aria-label="Client workspace"
                  className={filterSelectClass}
                >
                  {workspaceSelectOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <span className={cn("ml-1 mr-0.5", dashboardSectionLabel)}>Player</span>
          <div className="relative min-w-[160px] flex-1 sm:flex-none sm:min-w-[200px]">
            <Radio
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={selectedPlayerId}
              onChange={(e) => onPlayerChange(e.target.value)}
              aria-label="Filter by player"
              className={filterSelectClass}
            >
              <option value="all">All players</option>
              {playerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {resolveDeviceLabel(p.id, p.roomName || p.playerName)}
                </option>
              ))}
            </select>
          </div>

          {selectedPlayerId !== "all" && (
            <div
              className={cn(
                dashboardMutedSurface,
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  selectedPlayerMeta.status === "online" ? "bg-emerald-500" : "bg-gray-400"
                )}
                aria-hidden
              />
              <span className="font-medium text-gray-700 dark:text-zinc-300">
                {selectedPlayerMeta.status === "online" ? "Online" : "Offline"}
              </span>
              <span className="text-gray-300 dark:text-zinc-600" aria-hidden>
                ·
              </span>
              <span className="text-gray-500 dark:text-zinc-400">{selectedPlayerMeta.device}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
