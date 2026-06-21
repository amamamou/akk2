/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import {
  ALL_CLIENTS_WORKSPACE_ID,
  isAllClientsSelection,
  toActiveWorkspaceClients,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";
import type { PlayerInfo } from "@/types/api";
import {
  dashboardCardClass,
  dashboardContainerClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import { canProvisionPlayers, isManagerRole } from "@/lib/rbac";
import AddPlayerModal from "./components/AddPlayerModal";
import DeletePlayerModal from "./components/DeletePlayerModal";
import PlayerRow from "./components/PlayerRow";
import PlayersHero from "./components/PlayersHero";
import PlayersToolbar, {
  PlayersResultsSummary,
  PlayersSearch,
  type PlayerSortKey,
} from "./components/PlayersToolbar";
import PlayersEmptyState from "./components/PlayersEmptyState";
import PlayersPageSkeleton, {
  PlayersListPanelSkeleton,
  PlayersResultsSummarySkeleton,
  PlayersToolbarSkeleton,
  PlayersWorkspaceHeadingSkeleton,
} from "./components/PlayersPageSkeleton";
import PlayersListHeader, {
  PlayersWorkspaceHeading,
} from "./components/PlayersListHeader";
import PlaylistsPagination from "@/app/library/playlists/components/PlaylistsPagination";
import {
  normalizePlayerStatus,
  playerNeedsAttention,
  type PlayerStatusFilter,
} from "./lib/player-status";
import type { PlayerViewModel } from "./types";
import { usePlayerDeleteModal } from "./hooks/usePlayerDeleteModal";

export type PlayerType = PlayerViewModel;

const PLAYERS_WORKSPACE_STORAGE_KEY = "akou:players-workspace-client-id";

function readStoredWorkspaceClientId(): string {
  if (typeof window === "undefined") return ALL_CLIENTS_WORKSPACE_ID;
  return sessionStorage.getItem(PLAYERS_WORKSPACE_STORAGE_KEY) || ALL_CLIENTS_WORKSPACE_ID;
}

function persistWorkspaceClientId(clientId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLAYERS_WORKSPACE_STORAGE_KEY, clientId);
}

const STATUS_SORT_WEIGHT: Record<PlayerViewModel["status"], number> = {
  online: 0,
  idle: 1,
  offline: 2,
};

function readIsoDate(...candidates: unknown[]): string | undefined {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      const ms = Date.parse(value);
      if (!Number.isNaN(ms)) return value;
    }
  }
  return undefined;
}

function playerUpdatedMs(player: PlayerViewModel): number {
  const raw = player.updatedAt ?? player.createdAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? 0 : ms;
}

function mapApiPlayerToLocal(p: PlayerInfo): PlayerViewModel {
  const lastSeenMs = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
  const isOnline = lastSeenMs > 0 && Date.now() - lastSeenMs <= 2 * 60 * 1000;
  const metadata = p.metadata as Record<string, unknown> | null | undefined;
  const row = p as Record<string, unknown>;
  const createdAt = readIsoDate(
    metadata?.createdAt,
    metadata?.created_at,
    row.createdAt,
    row.created_at
  );
  const updatedAt = readIsoDate(
    p.lastSeen,
    metadata?.updatedAt,
    metadata?.updated_at,
    row.updatedAt,
    row.updated_at,
    createdAt
  );

  return {
    id: p.id,
    roomId: p.roomId || p.id,
    roomName: p.roomName || p.playerName || "",
    playerName: p.playerName || p.roomName || "",
    status: isOnline ? "online" : normalizePlayerStatus(p.status),
    playlist: p.playlist || [],
    playlistIndex: p.playlistIndex || 0,
    nowPlaying: p.nowPlaying || null,
    isPlaying: p.isPlaying || false,
    nextEvent: (p.nextEvent as PlayerViewModel["nextEvent"]) ?? null,
    playingProgress: p.playingProgress || 0,
    locationName: metadata?.locationName as string | undefined,
    createdAt,
    updatedAt,
  };
}

function sortPlayers(
  items: PlayerViewModel[],
  sort: PlayerSortKey,
  loadOrder: Map<string, number>
): PlayerViewModel[] {
  const sorted = [...items];

  switch (sort) {
    case "updated-desc":
      sorted.sort((a, b) => playerUpdatedMs(b) - playerUpdatedMs(a));
      break;
    case "created-desc":
      sorted.sort(
        (a, b) => (loadOrder.get(b.id) ?? 0) - (loadOrder.get(a.id) ?? 0)
      );
      break;
    case "name-asc":
      sorted.sort((a, b) => a.roomName.localeCompare(b.roomName));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.roomName.localeCompare(a.roomName));
      break;
    case "status":
      sorted.sort(
        (a, b) => STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status]
      );
      break;
    case "playing":
      sorted.sort((a, b) => Number(!!b.isPlaying) - Number(!!a.isPlaying));
      break;
  }

  return sorted;
}

function mapPlayerWithWorkspace(
  player: PlayerInfo,
  tenantId: string | undefined,
  clientName: string | undefined
): PlayerViewModel {
  return {
    ...mapApiPlayerToLocal(player),
    tenantId,
    clientName,
  };
}

function matchesQuery(player: PlayerViewModel, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const haystack = [
    player.roomName,
    player.playerName,
    player.locationName ?? "",
    player.clientName ?? "",
    player.nowPlaying?.title ?? "",
    player.nextEvent?.title ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}

function matchesStatusFilter(
  player: PlayerViewModel,
  statusFilter: PlayerStatusFilter,
  playingOnly: boolean
): boolean {
  if (playingOnly && !player.isPlaying) return false;
  if (statusFilter === "all") return true;
  if (statusFilter === "attention") return playerNeedsAttention(player.status);
  return player.status === statusFilter;
}

function groupPaginatedPlayersByClient(players: PlayerViewModel[]) {
  const groups: { clientKey: string; clientName: string; players: PlayerViewModel[] }[] = [];

  for (const player of players) {
    const clientName = player.clientName?.trim() || "Unknown workspace";
    const clientKey = player.tenantId ?? clientName;
    const last = groups[groups.length - 1];

    if (last && last.clientKey === clientKey) {
      last.players.push(player);
    } else {
      groups.push({ clientKey, clientName, players: [player] });
    }
  }

  return groups;
}

function playerRowKey(player: PlayerViewModel): string {
  return `${player.tenantId ?? player.clientName ?? "workspace"}:${player.id}`;
}

export default function PlayersClient() {
  const apiClient = getApiClient();
  const { user, isLoading: authLoading } = useAuth();
  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const canAdd = canProvisionPlayers(user?.role) && !isManagerRole(user?.role);

  const [players, setPlayers] = useState<PlayerViewModel[]>([]);
  const [loadOrder, setLoadOrder] = useState<Map<string, number>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlayerStatusFilter>("all");
  const [playingOnly, setPlayingOnly] = useState(false);
  const [sort, setSort] = useState<PlayerSortKey>("status");
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>([]);
  const [workspaceClientsLoading, setWorkspaceClientsLoading] = useState(true);
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] = useState(
    readStoredWorkspaceClientId
  );
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(null);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const perPageOptions = [5, 10, 20, 50];

  const isAllClientsView =
    isSuperAdmin && isAllClientsSelection(selectedWorkspaceClientId);

  const notifyPlayersUpdated = useCallback((count: number) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("akou:players-updated", { detail: { count } })
      );
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isSuperAdmin) {
      setWorkspaceClientsLoading(false);
      return;
    }

    let cancelled = false;
    setWorkspaceClientsLoading(true);

    void (async () => {
      try {
        const res = await apiClient.listClients();
        if (cancelled) return;
        const eligible = toActiveWorkspaceClients(res?.clients ?? []);
        setWorkspaceClients(eligible);

        setSelectedWorkspaceClientId((prev) => {
          const stored = readStoredWorkspaceClientId();
          const preferred = stored || prev;
          if (isAllClientsSelection(preferred)) return ALL_CLIENTS_WORKSPACE_ID;
          if (eligible.some((c) => c.id === preferred)) return preferred;
          return ALL_CLIENTS_WORKSPACE_ID;
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setLoadError(ax?.response?.data?.error || "Failed to load clients");
        setWorkspaceClients([]);
      } finally {
        if (!cancelled) setWorkspaceClientsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      apiClient.clearWorkspaceTenant();
    };
  }, [apiClient, isSuperAdmin, authLoading]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    if (isAllClientsSelection(selectedWorkspaceClientId)) {
      setWorkspaceTenantId(null);
      return;
    }

    const match = workspaceClients.find((c) => c.id === selectedWorkspaceClientId);
    setWorkspaceTenantId(match?.tenantId ?? null);
  }, [isSuperAdmin, selectedWorkspaceClientId, workspaceClients]);

  useEffect(() => {
    if (!successToast) return;
    const timer = window.setTimeout(() => setSuccessToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [successToast]);

  const applyViewTenantScope = useCallback(() => {
    if (!isSuperAdmin) return;
    if (isAllClientsView) {
      apiClient.clearWorkspaceTenant();
      return;
    }
    if (workspaceTenantId) {
      apiClient.setWorkspaceTenant(workspaceTenantId);
    }
  }, [apiClient, isSuperAdmin, isAllClientsView, workspaceTenantId]);

  const commitLoadedPlayers = useCallback(
    (list: PlayerViewModel[]) => {
      const order = new Map<string, number>();
      list.forEach((player, index) => order.set(player.id, index));
      setLoadOrder(order);
      setPlayers(list);
      notifyPlayersUpdated(list.length);
      return list;
    },
    [notifyPlayersUpdated]
  );

  const loadPlayersFromApi = useCallback(
    async (options?: { refresh?: boolean }): Promise<PlayerViewModel[]> => {
      const isRefresh = options?.refresh === true || hasLoadedOnceRef.current;
      if (isRefresh) setRefreshing(true);
      else setPlayersLoading(true);
      setLoadError(null);

      try {
        if (isSuperAdmin && isAllClientsView) {
          if (workspaceClients.length === 0) {
            setLoadOrder(new Map());
            setPlayers([]);
            notifyPlayersUpdated(0);
            return [];
          }

          const combined: PlayerViewModel[] = [];
          for (const client of workspaceClients) {
            apiClient.setWorkspaceTenant(client.tenantId);
            const res = await apiClient.getPlayers();
            combined.push(
              ...(res.players ?? []).map((p) =>
                mapPlayerWithWorkspace(p, client.tenantId, client.name)
              )
            );
          }
          apiClient.clearWorkspaceTenant();
          return commitLoadedPlayers(combined);
        }

        if (isSuperAdmin && !workspaceTenantId) {
          setLoadOrder(new Map());
          setPlayers([]);
          notifyPlayersUpdated(0);
          return [];
        }

        if (isSuperAdmin && workspaceTenantId) {
          apiClient.setWorkspaceTenant(workspaceTenantId);
        }

        const res = await apiClient.getPlayers();
        const client = workspaceClients.find((c) => c.id === selectedWorkspaceClientId);
        const mapped = (res.players ?? []).map((p) =>
          mapPlayerWithWorkspace(p, workspaceTenantId ?? undefined, client?.name)
        );
        return commitLoadedPlayers(mapped);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } } };
        setLoadError(ax?.response?.data?.error || "Failed to load players");
        setLoadOrder(new Map());
        setPlayers([]);
        return [];
      } finally {
        hasLoadedOnceRef.current = true;
        if (isRefresh) setRefreshing(false);
        else setPlayersLoading(false);
      }
    },
    [
      apiClient,
      isSuperAdmin,
      isAllClientsView,
      workspaceClients,
      workspaceTenantId,
      selectedWorkspaceClientId,
      notifyPlayersUpdated,
      commitLoadedPlayers,
    ]
  );

  useEffect(() => {
    if (authLoading) return;
    if (isSuperAdmin && workspaceClientsLoading) return;
    void loadPlayersFromApi({ refresh: hasLoadedOnceRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when workspace scope changes
  }, [
    authLoading,
    isSuperAdmin,
    workspaceClientsLoading,
    selectedWorkspaceClientId,
    workspaceTenantId,
    workspaceClients.length,
  ]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (!p.isPlaying || !p.nowPlaying) return p;
          const nextProgress = (p.playingProgress ?? 0) + 1;
          if (nextProgress >= p.nowPlaying.duration) {
            const nextIndex = (p.playlistIndex + 1) % Math.max(1, p.playlist.length);
            const nextTrack = p.playlist[nextIndex] ?? null;
            return {
              ...p,
              playlistIndex: nextIndex,
              nowPlaying: nextTrack,
              playingProgress: 0,
              isPlaying: !!nextTrack,
            };
          }
          return { ...p, playingProgress: nextProgress };
        })
      );
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const handleWorkspaceClientChange = (clientId: string) => {
    setLoadError(null);
    persistWorkspaceClientId(clientId);

    if (isAllClientsSelection(clientId)) {
      setSelectedWorkspaceClientId(ALL_CLIENTS_WORKSPACE_ID);
      setWorkspaceTenantId(null);
      return;
    }

    const match = workspaceClients.find((c) => c.id === clientId);
    if (!match) return;
    setSelectedWorkspaceClientId(clientId);
    setWorkspaceTenantId(match.tenantId);
  };

  const handleRefresh = () => {
    void loadPlayersFromApi({ refresh: true });
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setPlayingOnly(false);
  };

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = players.filter(
      (player) =>
        matchesQuery(player, normalizedQuery) &&
        matchesStatusFilter(player, statusFilter, playingOnly)
    );
    return sortPlayers(filtered, sort, loadOrder);
  }, [players, query, statusFilter, playingOnly, sort, loadOrder]);

  const totalCount = players.length;
  const filteredCount = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / perPage));
  const hasActiveFilters =
    statusFilter !== "all" || playingOnly || query.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [query, sort, statusFilter, playingOnly, selectedWorkspaceClientId]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPlayers.slice(start, start + perPage);
  }, [filteredPlayers, page, perPage]);

  const activeWorkspaceClient = useMemo(
    () => workspaceClients.find((c) => c.id === selectedWorkspaceClientId),
    [workspaceClients, selectedWorkspaceClientId]
  );

  const paginatedPlayerGroups = useMemo(() => {
    if (isAllClientsView) {
      return groupPaginatedPlayersByClient(paginatedPlayers);
    }

    if (isSuperAdmin && activeWorkspaceClient) {
      return [
        {
          clientKey: activeWorkspaceClient.id,
          clientName: activeWorkspaceClient.name,
          players: paginatedPlayers,
        },
      ];
    }

    return [
      {
        clientKey: "workspace",
        clientName: paginatedPlayers[0]?.clientName?.trim() || "Workspace",
        players: paginatedPlayers,
      },
    ];
  }, [
    isAllClientsView,
    isSuperAdmin,
    activeWorkspaceClient,
    paginatedPlayers,
  ]);

  const showWorkspaceHeadings = isSuperAdmin && paginatedPlayers.length > 0;

  const {
    playerToDelete,
    deleteOpen,
    deleteLoading,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
  } = usePlayerDeleteModal({
    apiClient,
    players,
    isSuperAdmin,
    workspaceTenantId,
    applyViewTenantScope,
    loadPlayersFromApi,
    notifyPlayersUpdated,
    setEditingId,
    setLoadError,
    setPlayers,
    setSuccessToast,
  });

  async function handleAddPlayer(playerData: {
    name: string;
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
    clientId?: string;
    tenantId?: string;
  }) {
    if (!canAdd) {
      throw new Error("Operation restricted to Super Admins only");
    }

    const { name, locationName, ipAddress, deviceId, tenantId, clientId } = playerData;
    const createTenantId = isSuperAdmin ? tenantId : undefined;

    if (isSuperAdmin && !createTenantId) {
      throw new Error("Select a client workspace before creating a player.");
    }

    if (isSuperAdmin && createTenantId) {
      apiClient.setWorkspaceTenant(createTenantId);
    }

    const response = await apiClient.createPlayer({
      name,
      macAddress: "",
      locationName,
      ipAddress,
      deviceId,
      tenantId: createTenantId,
      clientId,
    });

    applyViewTenantScope();
    const refreshed = await loadPlayersFromApi({ refresh: true });
    setEditingId(null);
    setSuccessToast("Player added");

    const createdId = response.player?.id;
    if (createdId && !isAllClientsView) {
      const normalizedQuery = query.trim().toLowerCase();
      const filtered = sortPlayers(
        refreshed.filter(
          (player) =>
            matchesQuery(player, normalizedQuery) &&
            matchesStatusFilter(player, statusFilter, playingOnly)
        ),
        sort,
        loadOrder
      );
      const index = filtered.findIndex((player) => player.id === createdId);
      if (index >= 0) {
        setPage(Math.floor(index / perPage) + 1);
      }
    }
  }

  function togglePlay(playerId: string) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        if (!p.nowPlaying && p.playlist.length > 0) {
          const track = p.playlist[p.playlistIndex] ?? null;
          return { ...p, nowPlaying: track, isPlaying: true, playingProgress: 0 };
        }
        return { ...p, isPlaying: !p.isPlaying };
      })
    );
    setEditingId(null);
  }

  function skip(playerId: string) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const nextIndex = (p.playlistIndex + 1) % Math.max(1, p.playlist.length);
        const nextTrack = p.playlist[nextIndex] ?? null;
        return {
          ...p,
          playlistIndex: nextIndex,
          nowPlaying: nextTrack,
          playingProgress: 0,
          isPlaying: !!nextTrack,
        };
      })
    );
    setEditingId(null);
  }

  async function renamePlayer(id: string, name: string) {
    setLoadError(null);
    const trimmed = name.trim();
    if (!trimmed) return;

    const target = players.find((p) => p.id === id);
    try {
      if (target?.tenantId) {
        apiClient.setWorkspaceTenant(target.tenantId);
      } else if (isSuperAdmin && workspaceTenantId) {
        apiClient.setWorkspaceTenant(workspaceTenantId);
      }

      await apiClient.updatePlayer(id, { name: trimmed });
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                roomName: trimmed,
                playerName: trimmed,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      setEditingId(null);
      setSuccessToast("Player updated");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setLoadError(ax?.response?.data?.error || "Failed to rename player");
    } finally {
      applyViewTenantScope();
    }
  }

  const rowProps = (p: PlayerViewModel, showClient = false) => ({
    player: p,
    showClient,
    deleting: deleteLoading && playerToDelete?.id === p.id,
    onPlayPause: togglePlay,
    onSkip: skip,
    onRename: renamePlayer,
    onRequestDelete: () => requestDelete(p),
    onRequestEdit: (id: string) => setEditingId(id),
    editing: editingId === p.id,
  });

  const pageLoading =
    (isSuperAdmin && workspaceClientsLoading) || (playersLoading && !refreshing);

  const needsWorkspaceSelection =
    isSuperAdmin && !isAllClientsView && !workspaceTenantId && !pageLoading;
  const noWorkspaces =
    isSuperAdmin && isAllClientsView && workspaceClients.length === 0 && !pageLoading;
  const showToolbar =
    !noWorkspaces && !needsWorkspaceSelection && (isSuperAdmin || totalCount > 0 || pageLoading);
  const showEmptyNoPlayers =
    !pageLoading && !needsWorkspaceSelection && !noWorkspaces && totalCount === 0;
  const showEmptyNoResults =
    !pageLoading &&
    !needsWorkspaceSelection &&
    !noWorkspaces &&
    totalCount > 0 &&
    filteredCount === 0;
  const showPagination =
    !showEmptyNoPlayers && !needsWorkspaceSelection && !noWorkspaces;

  if (authLoading) {
    return (
      <PlayersPageSkeleton
        perPage={perPage}
        page={page}
        totalPages={Math.max(1, totalPages)}
        showWorkspace={isSuperAdmin}
      />
    );
  }

  return (
    <div className={dashboardPageClass}>
      {successToast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg dark:border-emerald-900/40 dark:bg-emerald-950/80 dark:text-emerald-100"
        >
          <Check size={16} strokeWidth={2.5} />
          {successToast}
        </div>
      ) : null}

      <div className={dashboardContainerClass}>
        <PlayersHero
          onAddClick={canAdd ? () => setAddPlayerModalOpen(true) : undefined}
          addDisabled={needsWorkspaceSelection}
          searchSlot={<PlayersSearch query={query} setQuery={setQuery} />}
        />

        {loadError ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{loadError}</p>
          </div>
        ) : null}

        {showToolbar ? (
          pageLoading ? (
            <PlayersToolbarSkeleton showWorkspace={isSuperAdmin} />
          ) : (
            <PlayersToolbar
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={(value) => {
                setStatusFilter(value);
                setPlayingOnly(false);
              }}
              sort={sort}
              setSort={setSort}
              onClearFilters={clearFilters}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              hasActiveFilters={hasActiveFilters}
              showWorkspaceSelector={isSuperAdmin}
              workspaceClients={workspaceClients}
              selectedWorkspaceClientId={selectedWorkspaceClientId}
              onChangeWorkspaceClient={handleWorkspaceClientChange}
            />
          )
        ) : null}

        {needsWorkspaceSelection ? (
          <PlayersEmptyState variant="select-workspace" />
        ) : noWorkspaces ? (
          <PlayersEmptyState variant="no-workspaces" />
        ) : (
          <>
            {!pageLoading && filteredCount > 0 ? (
              <PlayersResultsSummary
                page={page}
                perPage={perPage}
                filteredCount={filteredCount}
                totalCount={totalCount}
                displayedCount={paginatedPlayers.length}
                hasActiveFilters={hasActiveFilters}
              />
            ) : null}

            {pageLoading ? (
              <PlayersResultsSummarySkeleton />
            ) : null}

            {pageLoading ? (
              <div className="space-y-6">
                {isSuperAdmin ? <PlayersWorkspaceHeadingSkeleton /> : null}
                <PlayersListPanelSkeleton count={perPage} />
              </div>
            ) : showEmptyNoPlayers ? (
              <PlayersEmptyState
                variant="no-players"
                onAddClick={canAdd ? () => setAddPlayerModalOpen(true) : undefined}
              />
            ) : showEmptyNoResults ? (
              <PlayersEmptyState variant="no-results" onClearFilters={clearFilters} />
            ) : (
              <div
                className={cn(
                  "space-y-6",
                  refreshing && "pointer-events-none opacity-60 transition-opacity"
                )}
              >
                {paginatedPlayerGroups.map((group) => (
                  <section key={group.clientKey}>
                    {showWorkspaceHeadings ? (
                      <PlayersWorkspaceHeading
                        name={group.clientName}
                        count={group.players.length}
                      />
                    ) : null}
                    <div className={cn(dashboardCardClass, "overflow-hidden")}>
                      <PlayersListHeader />
                      <div>
                        {group.players.map((p) => (
                          <PlayerRow key={playerRowKey(p)} {...rowProps(p)} />
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {showPagination ? (
          <PlaylistsPagination
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            perPageOptions={perPageOptions}
            totalPages={totalPages}
            disabled={pageLoading || refreshing}
            showTopBorder={false}
            ariaLabel="Player pagination"
          />
        ) : null}
      </div>

      <AddPlayerModal
        isOpen={addPlayerModalOpen && canAdd}
        onClose={() => setAddPlayerModalOpen(false)}
        onSubmit={handleAddPlayer}
        lockedClientId={
          isAllClientsSelection(selectedWorkspaceClientId)
            ? undefined
            : selectedWorkspaceClientId
        }
        defaultClientId={
          isAllClientsSelection(selectedWorkspaceClientId)
            ? workspaceClients[0]?.id ?? ""
            : selectedWorkspaceClientId
        }
      />

      <DeletePlayerModal
        open={deleteOpen}
        player={playerToDelete}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={deleteLoading}
      />
    </div>
  );
}
