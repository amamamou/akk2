export type PlayerConnectionStatus = "online" | "offline" | "idle";

export type PlayerStatusFilter = "all" | PlayerConnectionStatus | "attention";

export const STATUS_CONFIG: Record<
  PlayerConnectionStatus,
  {
    label: string;
    shortLabel: string;
    dotClass: string;
    badgeClass: string;
    iconClass: string;
  }
> = {
  online: {
    label: "Online",
    shortLabel: "Connected",
    dotClass: "bg-gray-400 dark:bg-zinc-500",
    badgeClass:
      "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/30",
    iconClass: "text-gray-500 dark:text-zinc-400",
  },
  offline: {
    label: "Offline",
    shortLabel: "Unreachable",
    dotClass: "bg-gray-300 dark:bg-zinc-600",
    badgeClass:
      "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/30",
    iconClass: "text-gray-500 dark:text-zinc-400",
  },
  idle: {
    label: "Idle",
    shortLabel: "Needs attention",
    dotClass: "bg-gray-400 dark:bg-zinc-500",
    badgeClass:
      "bg-gray-100 text-gray-600 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/30",
    iconClass: "text-gray-500 dark:text-zinc-400",
  },
};

export function playerNeedsAttention(status: PlayerConnectionStatus): boolean {
  return status === "offline" || status === "idle";
}

export function normalizePlayerStatus(
  status: string | undefined
): PlayerConnectionStatus {
  if (status === "online" || status === "idle") return status;
  return "offline";
}
