/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlayersHeader from "./components/PlayersHeader";
import PlayerRow from "./components/PlayerRow";
import PlayerCard from "./components/PlayerCard";
import PlayersToolbar from "./components/PlayersToolbar";

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

type PlayerStatusFilter = "all" | PlayerType["status"];

export default function PlayersClient() {
  const [view, setView] = useState<"list" | "grid">("list");
  const [players, setPlayers] = useState<PlayerType[]>(initialPlayers);
  const [counter, setCounter] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PlayerStatusFilter>("all");

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

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      setPlayers(parsed as PlayerType[]);
    } catch (err) {
      console.error("Failed to read players from storage", err);
    }
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

  function handleAddPlayer() {
    const id = `p-new-${Date.now()}`;
    const newPlayer: PlayerType = {
      id,
      roomId: `room-${counter}`,
      roomName: `Room ${counter}`,
      playerName: `Player ${counter}`,
      status: "online",
      playlist: [],
      playlistIndex: 0,
      nowPlaying: null,
      isPlaying: false,
      nextEvent: null,
      playingProgress: 0,
    };
    setCounter((c) => c + 1);
    setPlayers((prev) => {
      const next = [newPlayer, ...prev];
      persistPlayers(next);
      return next;
    });
    // set the new player into edit mode so name can be changed immediately
    setEditingId(id);
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
      if (statusFilter !== "all" && player.status !== statusFilter) {
        return false;
      }

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
  }, [players, query, statusFilter]);

  const gridCols = useMemo(
    () => "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
    [],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <PlayersHeader
        view={view}
        onToggleView={(v) => setView(v)}
        onAdd={handleAddPlayer}
      />

      <PlayersToolbar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onChangeStatus={setStatusFilter}
        totalCount={players.length}
        filteredCount={filteredPlayers.length}
      />

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4">
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
              {filteredPlayers.map((p) => (
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
              {filteredPlayers.map((p) => (
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
    </div>
  );
}
