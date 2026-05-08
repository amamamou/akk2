/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getApiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import PlayersHeader from "./components/PlayersHeader";
import PlayerRow from "./components/PlayerRow";
import PlayerCard from "./components/PlayerCard";
// top toolbar removed per UX request
import AudioToolbar from "../library/components/AudioToolbar";
import PlayersTriageBar from "./components/PlayersTriageBar";

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
};

const STORAGE_KEY = "akou.players";

// Start with no players; they are added dynamically by the user
// and optionally restored from localStorage.
const initialPlayers: PlayerType[] = [];

// PlayerStatusFilter removed (top filter removed)

export default function PlayersClient() {
  const [view, setView] = useState<"list" | "grid">("grid");
  const [players, setPlayers] = useState<PlayerType[]>(initialPlayers);
  const [counter, setCounter] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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

  const persistPlayers = useCallback((next: PlayerType[]) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        // Let other parts of the app (like the schedule page) know that
        // players have changed so they can refresh any derived views.
        window.dispatchEvent(
          new CustomEvent("akou:players-updated", {
            detail: { count: next.length },
          }),
        );
      }
    } catch (err) {
      console.error("Failed to persist players", err);
    }
  }, []);

  // After first mount on the client, replace the in-memory state with any
  // previously persisted players from localStorage. This runs only on the
  // client, so it won't cause SSR/client HTML mismatches.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Try loading players from API first; fall back to localStorage if offline
    const apiClient = getApiClient();
    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.listPlayers();
        if (cancelled) return;
          if (res?.players && Array.isArray(res.players) && res.players.length > 0) {
            // Map server PlayerInfo -> local PlayerType shape (best-effort)
            // Use lastSeen to derive an accurate online/offline status instead
            // of trusting any stale/hardcoded status values.
            const mapped = res.players.map((p) => {
              const lastSeenMs = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
              const isOnline = lastSeenMs && (Date.now() - lastSeenMs <= 2 * 60 * 1000);
              return ({
                id: p.id,
                roomId: p.roomId || p.id,
                roomName: p.roomName || p.playerName || "",
                playerName: p.playerName || p.roomName || "",
                status: isOnline ? "online" : "offline",
                playlist: p.playlist || [],
                playlistIndex: p.playlistIndex || 0,
                nowPlaying: p.nowPlaying || null,
                isPlaying: p.isPlaying || false,
                nextEvent: null,
                playingProgress: p.playingProgress || 0,
                // preserve raw lastSeen and macAddress for other flows
                // @ts-ignore - extend shape locally
                lastSeen: p.lastSeen,
                // @ts-ignore
                macAddress: p.macAddress || p.mac_address || "",
              } as PlayerType);
            });

          setPlayers(mapped);
          persistPlayers(mapped);
          return;
        }
      } catch (err) {
        // ignore and fall back to localStorage
      }

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        setPlayers(parsed as PlayerType[]);
      } catch (err) {
        console.error("Failed to read players from storage", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function handleAddPlayer() {
    const apiClient = getApiClient();
    const localName = `Player ${counter}`;
    setCounter((c) => c + 1);

    // Optimistic local id while request is in-flight
    const tempId = `p-new-${Date.now()}`;
    const optimistic: PlayerType = {
      id: tempId,
      roomId: tempId,
      roomName: localName,
      playerName: localName,
      status: "offline",
      playlist: [],
      playlistIndex: 0,
      nowPlaying: null,
      isPlaying: false,
      nextEvent: null,
      playingProgress: 0,
    };

    setPlayers((prev) => {
      const next = [optimistic, ...prev];
      persistPlayers(next);
      return next;
    });

    setEditingId(tempId);

    try {
      // Backend PlayerCreate shape (akk2) expects { name, macAddress }
      const created = await apiClient.createPlayer({ name: localName, macAddress: "" });
      const p = created.player;
      const mapped: PlayerType = {
        id: p.id,
        roomId: p.roomId || p.id,
        roomName: p.roomName || p.playerName || localName,
        playerName: p.playerName || p.roomName || localName,
        status: p.status || "offline",
        playlist: p.playlist || [],
        playlistIndex: p.playlistIndex || 0,
        nowPlaying: p.nowPlaying || null,
        isPlaying: p.isPlaying || false,
        nextEvent: null,
        playingProgress: p.playingProgress || 0,
      };

      // Replace optimistic item if present, otherwise prepend
      setPlayers((prev) => {
        const replaced = prev.map((pl) => (pl.id === tempId ? mapped : pl));
        const exists = replaced.some((pl) => pl.id === mapped.id);
        const next = exists ? replaced : [mapped, ...prev.filter((pl) => pl.id !== tempId)];
        persistPlayers(next);
        return next;
      });

      // Fire a global event so other parts (dashboard/schedule) can refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("akou:players-updated", { detail: { count: 1 } }));
      }
    } catch (err) {
      console.error("Failed to create player", err);
      // Show an error to the user (toast system may not be available in this project)
      try {
        const msg = (err as any)?.response?.data?.error || (err as any)?.message || "Failed to create player";
        if (typeof window !== "undefined") window.alert(`Error creating player: ${msg}`);
      } catch (e) {
        // ignore
      }

      // On error, remove optimistic entry and clear editing state
      setPlayers((prev) => {
        const next = prev.filter((pl) => pl.id !== tempId);
        persistPlayers(next);
        return next;
      });
      setEditingId(null);
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
    // rename the room name (per user request) instead of the player label
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, roomName: name } : p,
      );
      persistPlayers(next);
      return next;
    });
    setEditingId(null);
  }

  function deletePlayer(id: string) {
    setPlayers((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistPlayers(next);
      return next;
    });
    setEditingId(null);
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

  const gridCols = useMemo(
    () => "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
    [],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <PlayersHeader view={view} onToggleView={(v) => setView(v)} onAdd={handleAddPlayer} />
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
          {players.length === 0 ? (
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
    </div>
  );
}
