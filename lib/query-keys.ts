/** Centralized React Query keys for cache identity and invalidation. */

export const queryKeys = {
  players: (tenantId?: string | null) =>
    ["players", tenantId ?? "session"] as const,
  media: (tenantId?: string | null) => ["media", tenantId ?? "session"] as const,
  schedules: (tenantId?: string | null) =>
    ["schedules", tenantId ?? "session"] as const,
  workspaceClients: () => ["workspace-clients"] as const,
  clientsBilling: () => ["clients-billing-overview"] as const,
  systemHealth: (scope?: string) =>
    ["system-health", scope ?? "tenant"] as const,
  playbackLogs: (scope?: string, limit = 200) =>
    ["playback-logs", scope ?? "tenant", limit] as const,
  dashboardActivity: () => ["dashboard-activity"] as const,
  schedule: (workspaceKey: string) => ["schedule", workspaceKey] as const,
  scheduleAllClients: (workspaceKey: string) =>
    ["schedule", "all-clients", workspaceKey] as const,
  playlists: () => ["playlists"] as const,
  playlist: (playlistId: string) => ["playlist", playlistId] as const,
};
