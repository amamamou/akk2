/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import {
  ALL_CLIENTS_WORKSPACE_ID,
  isAllClientsSelection,
  toActiveWorkspaceClients,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";
import { ChevronDown } from "lucide-react";
import type { PlayerInfo } from "@/types/api";
import { useRouter } from "next/navigation";
import PlayersHeader from "./components/PlayersHeader";
import PlayerRow from "./components/PlayerRow";
import PlayerCard from "./components/PlayerCard";
import AddPlayerModal from "./components/AddPlayerModal";
// top toolbar removed per UX request
import AudioToolbar from "../library/components/AudioToolbar";
import PlayersTriageBar from "./components/PlayersTriageBar";
import { canProvisionPlayers, isManagerRole } from "@/lib/rbac";

export type Track = { id: string; title: string; duration: number };

export type Upcoming = { id: string; title: string; time?: string } | null;

export type PlayerType = {
  id: string;
  roomId: string;
  roomName: string;
  playerName: string;
  status: "online" | "offline" | "idle";
  playlist: Track[];
  playlistIndex: number;
  nowPlaying?: Track | null;
  isPlaying?: boolean;
  nextEvent?: Upcoming;
  playingProgress?: number;
  tenantId?: string;
  clientName?: string;
};

const initialPlayers: PlayerType[] = [];

// PlayerStatusFilter removed (top filter removed)

function mapApiPlayerToLocal(p: PlayerInfo): PlayerType {
  const lastSeenMs = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
  const isOnline = lastSeenMs && Date.now() - lastSeenMs <= 2 * 60 * 1000;
  return {
    id: p.id,
    roomId: p.roomId || p.id,
    roomName: p.roomName || p.playerName || "",
    playerName: p.playerName || p.roomName || "",
    status: isOnline ? "online" : p.status || "offline",
    playlist: p.playlist || [],
    playlistIndex: p.playlistIndex || 0,
    nowPlaying: p.nowPlaying || null,
    isPlaying: p.isPlaying || false,
    nextEvent: null,
    playingProgress: p.playingProgress || 0,
  };
}

export default function PlayersClient() {
  const apiClient = getApiClient();
  const { user, isLoading: authLoading } = useAuth();
  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const [view, setView] = useState<"list" | "grid">("grid");
  const [players, setPlayers] = useState<PlayerType[]>(initialPlayers);
  const [counter, setCounter] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>(
    []
  );
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] =
    useState(ALL_CLIENTS_WORKSPACE_ID);
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(null);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>(
    {}
  );
  const [playersLoading, setPlayersLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isAllClientsView =
    isSuperAdmin && isAllClientsSelection(selectedWorkspaceClientId);
  // top filter removed, keep query only
  // pagination (reuse audio/playlist toolbar controls)
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const perPageOptions = [5, 10, 20, 50];

  // players triage / filters state (for PlayersTriageBar)
  const [sortBy, setSortBy] = useState<'added'|'title'|'duration'>('added');
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc');
  const [sortOpen, setSortOpen] = useState(false);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [dateFilterType, setDateFilterType] = useState<'all'|'last7'|'last30'|'custom'>('all');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [singerFilter, setSingerFilter] = useState<string | null>(null);
  const [singerOpen, setSingerOpen] = useState(false);
  const [singerQuery, setSingerQuery] = useState("");
  const singerOptions: string[] = [];

  const [playlistFilter, setPlaylistFilter] = useState<string | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistQuery, setPlaylistQuery] = useState("");
  const playlistOptions: { id: string; title: string }[] = [];

  const [creatorFilter, setCreatorFilter] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorQuery, setCreatorQuery] = useState("");
  const creatorOptions: string[] = [];

  // helper: monthDays for calendar rendering
  const monthDays = (y:number,m:number) => {
    const first = new Date(y, m, 1);
    const days: Array<{day:number|null;date?:string}> = [];
    const startDay = first.getDay();
    for (let i=0;i<startDay;i++) days.push({day:null});
    const d = new Date(y,m+1,0).getDate();
    for (let i=1;i<=d;i++) days.push({day:i,date: new Date(y,m,i).toISOString().slice(0,10)});
    return days;
  };

  const formatDateLabel = (iso:string|null) => iso ? new Date(iso).toLocaleDateString() : null;

  const notifyPlayersUpdated = useCallback((count: number) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("akou:players-updated", { detail: { count } })
      );
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin || authLoading) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.listClients();
        if (cancelled) return;
        const eligible = toActiveWorkspaceClients(res?.clients ?? []);
        setWorkspaceClients(eligible);
        setExpandedClients((prev) => {
          const next = { ...prev };
          for (const c of eligible) {
            if (next[c.id] === undefined) next[c.id] = true;
          }
          return next;
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setLoadError(ax?.response?.data?.error || "Failed to load clients");
        setWorkspaceClients([]);
      }
    })();

    return () => {
      cancelled = true;
      apiClient.clearWorkspaceTenant();
    };
  }, [apiClient, isSuperAdmin, authLoading, user?.tenantId]);

  const loadPlayersFromApi = useCallback(async () => {
    if (isSuperAdmin && isAllClientsView) {
      if (workspaceClients.length === 0) {
        setPlayers([]);
        setPlayersLoading(false);
        return;
      }

      setPlayersLoading(true);
      setLoadError(null);
      try {
        const combined: PlayerType[] = [];
        for (const client of workspaceClients) {
          apiClient.setWorkspaceTenant(client.tenantId);
          const res = await apiClient.getPlayers();
          const mapped = (res.players ?? []).map((p) => ({
            ...mapApiPlayerToLocal(p),
            tenantId: client.tenantId,
            clientName: client.name,
          }));
          combined.push(...mapped);
        }
        setPlayers(combined);
        notifyPlayersUpdated(combined.length);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } } };
        setLoadError(ax?.response?.data?.error || "Failed to load players");
        setPlayers([]);
      } finally {
        setPlayersLoading(false);
      }
      return;
    }

    if (isSuperAdmin && !workspaceTenantId) {
      setPlayers([]);
      setPlayersLoading(false);
      return;
    }

    if (isSuperAdmin && workspaceTenantId) {
      apiClient.setWorkspaceTenant(workspaceTenantId);
    }

    setPlayersLoading(true);
    setLoadError(null);

    try {
      const res = await apiClient.getPlayers();
      const client = workspaceClients.find(
        (c) => c.id === selectedWorkspaceClientId
      );
      if (res?.players && Array.isArray(res.players)) {
        const mapped = res.players.map((p) => ({
          ...mapApiPlayerToLocal(p),
          tenantId: workspaceTenantId ?? undefined,
          clientName: client?.name,
        }));
        setPlayers(mapped);
        notifyPlayersUpdated(mapped.length);
        return;
      }
      setPlayers([]);
      notifyPlayersUpdated(0);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setLoadError(ax?.response?.data?.error || "Failed to load players");
      setPlayers([]);
    } finally {
      setPlayersLoading(false);
    }
  }, [
    apiClient,
    isSuperAdmin,
    isAllClientsView,
    workspaceClients,
    workspaceTenantId,
    selectedWorkspaceClientId,
    notifyPlayersUpdated,
  ]);

  useEffect(() => {
    if (authLoading) return;
    void loadPlayersFromApi();
  }, [authLoading, loadPlayersFromApi]);

  const handleWorkspaceClientChange = (clientId: string) => {
    if (isAllClientsSelection(clientId)) {
      setSelectedWorkspaceClientId(ALL_CLIENTS_WORKSPACE_ID);
      setWorkspaceTenantId(null);
      setLoadError(null);
      return;
    }
    const match = workspaceClients.find((c) => c.id === clientId);
    if (!match) return;
    setSelectedWorkspaceClientId(clientId);
    setWorkspaceTenantId(match.tenantId);
    setLoadError(null);
  };

  const toggleClientAccordion = (clientId: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Simulate playback progress for all playing players
  useEffect(() => {
    const t = setInterval(() => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (!p.isPlaying || !p.nowPlaying) return p;
          const nextProgress = (p.playingProgress ?? 0) + 1;
          if (nextProgress >= p.nowPlaying.duration && p.nowPlaying) {
            const nextIndex =
              (p.playlistIndex + 1) % Math.max(1, p.playlist.length);
            const nextTrack = p.playlist[nextIndex] ?? null;
            return {
              ...p,
              playlistIndex: nextIndex,
              nowPlaying: nextTrack,
              playingProgress: nextTrack ? 0 : 0,
              isPlaying: !!nextTrack,
            };
          }

          return { ...p, playingProgress: nextProgress };
        }),
      );
    }, 1000);

    return () => clearInterval(t);
  }, []);

  async function handleAddPlayer(playerData: {
    name: string;
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
    clientId?: string;
    tenantId?: string;
  }) {
    if (!canProvisionPlayers(user?.role) || isManagerRole(user?.role)) {
      throw new Error("Operation restricted to Super Admins only");
    }

    const { name, locationName, ipAddress, deviceId, tenantId } = playerData;

    if (isSuperAdmin) {
      if (!tenantId) {
        throw new Error("Select a client workspace before creating a player.");
      }
      apiClient.setWorkspaceTenant(tenantId);
      if (playerData.clientId) {
        setSelectedWorkspaceClientId(playerData.clientId);
        setWorkspaceTenantId(tenantId);
      }
    }

    try {
      await apiClient.createPlayer({
        name,
        macAddress: "",
        locationName,
        ipAddress,
        deviceId,
        tenantId,
        clientId: playerData.clientId,
      });
      await loadPlayersFromApi();
      setEditingId(null);
    } catch (err) {
      console.error("Failed to create player", err);
      const msg =
        (err as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error ||
        (err as Error)?.message ||
        "Failed to create player";
      throw new Error(msg);
    }
  }

  function togglePlay(playerId: string) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        // if no nowPlaying and playlist available, start current index track
        if (!p.nowPlaying && p.playlist.length > 0) {
          const track = p.playlist[p.playlistIndex] ?? null;
          return {
            ...p,
            nowPlaying: track,
            isPlaying: true,
            playingProgress: 0,
          };
        }

        return { ...p, isPlaying: !p.isPlaying };
      }),
    );
    // clear editing focus when interacting
    setEditingId(null);
  }

  function skip(playerId: string) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        const nextIndex =
          (p.playlistIndex + 1) % Math.max(1, p.playlist.length);
        const nextTrack = p.playlist[nextIndex] ?? null;
        return {
          ...p,
          playlistIndex: nextIndex,
          nowPlaying: nextTrack,
          playingProgress: 0,
          isPlaying: !!nextTrack,
        };
      }),
    );
    setEditingId(null);
  }

  function renamePlayer(id: string, name: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, roomName: name } : p))
    );
    setEditingId(null);
  }

  async function deletePlayer(id: string) {
    setLoadError(null);
    try {
      const target = players.find((p) => p.id === id);
      if (target?.tenantId) {
        apiClient.setWorkspaceTenant(target.tenantId);
      } else if (workspaceTenantId) {
        apiClient.setWorkspaceTenant(workspaceTenantId);
      }
      await apiClient.deletePlayer(id);
      setEditingId(null);
      await loadPlayersFromApi();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setLoadError(ax?.response?.data?.error || "Failed to delete player");
    }
  }

  const router = useRouter();

  function openScheduleForRoom(playerId: string) {
    // We use the player id as the schedule row id so each player
    // appears as its own row in the schedule view.
    router.push(`/schedule?roomId=${playerId}`);
  }

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return players.filter((player) => {
      if (!normalizedQuery) return true;

      const haystack = [
        player.roomName,
        player.playerName,
        player.nowPlaying?.title ?? "",
        player.nextEvent?.title ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [players, query]);

  const totalFiltered = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));

  // ensure page is valid when filtered count or perPage changes
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPlayers.slice(start, start + perPage);
  }, [filteredPlayers, page, perPage]);

  const playersByClient = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workspaceClients.map((client) => {
      const clientPlayers = players.filter((p) => p.tenantId === client.tenantId);
      const filtered = !normalizedQuery
        ? clientPlayers
        : clientPlayers.filter((player) => {
            const haystack = [
              player.roomName,
              player.playerName,
              player.nowPlaying?.title ?? "",
              player.nextEvent?.title ?? "",
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(normalizedQuery);
          });
      return { client, players: filtered };
    });
  }, [workspaceClients, players, query]);

  const gridCols = useMemo(
    () => "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
    [],
  );

   return (
     <div className="flex-1 flex flex-col overflow-hidden bg-white">
       <PlayersHeader
         view={view}
         onToggleView={(v) => setView(v)}
         onAdd={() => setAddPlayerModalOpen(true)}
         showWorkspaceSelector={isSuperAdmin}
         workspaceClients={workspaceClients}
         selectedWorkspaceClientId={selectedWorkspaceClientId}
         onChangeWorkspaceClient={handleWorkspaceClientChange}
       />
      {/* Players triage bar (sort / date / filters) */}
      <PlayersTriageBar
        sortBy={sortBy}
        sortDir={sortDir}
        sortOpen={sortOpen}
        setSortOpen={setSortOpen}
        setSortBy={setSortBy}
        setSortDir={setSortDir}

        singerFilter={singerFilter}
        singerOpen={singerOpen}
        singerQuery={singerQuery}
        singerOptions={singerOptions}
        setSingerFilter={setSingerFilter}
        setSingerOpen={setSingerOpen}
        setSingerQuery={setSingerQuery}

        datePickerOpen={datePickerOpen}
        customDate={customDate}
        dateFilterType={dateFilterType}
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        setDatePickerOpen={setDatePickerOpen}
        setCustomDate={setCustomDate}
        setDateFilterType={setDateFilterType}
        monthDays={monthDays}
        formatDateLabel={formatDateLabel}

        playlistFilter={playlistFilter}
        playlistOpen={playlistOpen}
        playlistQuery={playlistQuery}
        playlistOptions={playlistOptions}
        setPlaylistFilter={setPlaylistFilter}
        setPlaylistOpen={setPlaylistOpen}
        setPlaylistQuery={setPlaylistQuery}
        setActiveCategory={() => {}}

        creatorFilter={creatorFilter}
        creatorOpen={creatorOpen}
        creatorQuery={creatorQuery}
        creatorOptions={creatorOptions}
        setCreatorFilter={setCreatorFilter}
        setCreatorOpen={setCreatorOpen}
        setCreatorQuery={setCreatorQuery}
      />

      <div className="flex-1 overflow-auto">
  <div className="px-6 py-6">
          {loadError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {loadError}
            </div>
          )}
          {isSuperAdmin &&
          !isAllClientsView &&
          !workspaceTenantId ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-sm font-semibold text-gray-900">
                  Select a client workspace
                </h2>
                <p className="text-xs text-gray-500">
                  Choose a client above to view or add players for that tenant.
                  Those players will appear on the Weekly Schedule for that client.
                </p>
              </div>
            </div>
          ) : playersLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
              Loading players…
            </div>
          ) : isAllClientsView ? (
            <div className="space-y-3">
              {workspaceClients.length === 0 ? (
                <p className="text-sm text-gray-500 py-12 text-center">
                  No active client workspaces found.
                </p>
              ) : playersByClient.every((g) => g.players.length === 0) ? (
                <p className="text-sm text-gray-500 py-12 text-center">
                  No players found across client workspaces.
                </p>
              ) : (
                playersByClient.map(({ client, players: groupPlayers }) => {
                  if (groupPlayers.length === 0) return null;
                  const expanded = expandedClients[client.id] ?? true;
                  return (
                    <div
                      key={client.id}
                      className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleClientAccordion(client.id)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-white hover:from-violet-100/80 transition-colors text-left"
                      >
                        <div>
                          <span className="font-semibold text-gray-900">
                            {client.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {groupPlayers.length}{" "}
                            {groupPlayers.length === 1 ? "player" : "players"}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-gray-500 shrink-0 transition-transform duration-200 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expanded && (
                        <div className="border-t border-gray-100 px-2 py-3">
                          {view === "list" ? (
                            <div className="space-y-2">
                              {groupPlayers.map((p) => (
                                <PlayerRow
                                  key={p.id}
                                  player={p}
                                  onPlayPause={togglePlay}
                                  onSkip={skip}
                                  onRename={renamePlayer}
                                  onDelete={deletePlayer}
                                  onRequestEdit={(id) => setEditingId(id)}
                                  editing={editingId === p.id}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className={`grid gap-4 ${gridCols}`}>
                              {groupPlayers.map((p) => (
                                <PlayerCard
                                  key={p.id}
                                  player={p}
                                  onRename={renamePlayer}
                                  onDelete={deletePlayer}
                                  onRequestEdit={(id) => setEditingId(id)}
                                  editing={editingId === p.id}
                                  onOpenSchedule={() =>
                                    openScheduleForRoom(p.roomId)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  No players yet
                </h2>
                <p className="text-xs text-gray-500 max-w-sm">
                  Add your first player to start managing your audio devices by
                  location.
                </p>
              </div>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  No players match your filters
                </h2>
                <p className="text-xs text-gray-500 max-w-sm">
                  Try adjusting your search or status filters to see more players.
                </p>
              </div>
            </div>
          ) : view === "list" ? (
            <div className="space-y-2">
              {paginatedPlayers.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  onPlayPause={togglePlay}
                  onSkip={skip}
                  onRename={renamePlayer}
                  onDelete={deletePlayer}
                  onRequestEdit={(id) => setEditingId(id)}
                  editing={editingId === p.id}
                />
              ))}
            </div>
          ) : (
            <div className={`grid gap-4 ${gridCols}`}>
              {paginatedPlayers.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  onRename={renamePlayer}
                  onDelete={deletePlayer}
                  onRequestEdit={(id) => setEditingId(id)}
                  editing={editingId === p.id}
                  onOpenSchedule={() => openScheduleForRoom(p.roomId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
       <AudioToolbar
         query={query}
         setQuery={setQuery}
         filteredCount={totalFiltered}
         totalCount={players.length}
         page={page}
         setPage={setPage}
         perPage={perPage}
         setPerPage={setPerPage}
         perPageOptions={perPageOptions}
         totalPages={totalPages}
         placeholder="Search by room, player, track..."
       />

       {/* Add Player Modal */}
       <AddPlayerModal
         isOpen={addPlayerModalOpen && canProvisionPlayers(user?.role)}
         onClose={() => setAddPlayerModalOpen(false)}
         onSubmit={handleAddPlayer}
         defaultClientId={
           isAllClientsSelection(selectedWorkspaceClientId)
             ? workspaceClients[0]?.id ?? ""
             : selectedWorkspaceClientId
         }
       />
     </div>
   );
 }
