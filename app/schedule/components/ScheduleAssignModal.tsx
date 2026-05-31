"use client";

import React, { useEffect, useState } from "react";
import { ListMusic, Music, X } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { PlaylistApiInfo } from "@/types/api";
import { apiPlaylistToUi } from "@/lib/playlist-mapper";

type AudioItem = { id: string; title: string; duration: number; type: string; url?: string };

export type PlaylistPick = {
  playlistId: string;
  title: string;
  trackCount: number;
  totalDuration: string;
};

type Tab = "audio" | "playlist";

export default function ScheduleAssignModal({
  open,
  onClose,
  audio,
  onSelectAudio,
  onSelectPlaylist,
}: {
  open: boolean;
  onClose: () => void;
  audio: AudioItem[];
  onSelectAudio: (item: AudioItem) => void;
  onSelectPlaylist: (item: PlaylistPick) => void;
}) {
  const [tab, setTab] = useState<Tab>("audio");
  const [playlists, setPlaylists] = useState<PlaylistPick[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPlaylists(true);
    setPlaylistError(null);
    void (async () => {
      try {
        const res = await getApiClient().listPlaylists();
        if (cancelled) return;
        const picks: PlaylistPick[] = [];
        for (const row of res.playlists ?? []) {
          const ui = apiPlaylistToUi(row as PlaylistApiInfo);
          if (!ui) continue;
          picks.push({
            playlistId: ui.id,
            title: ui.title,
            trackCount: ui.trackCount,
            totalDuration: ui.totalDuration,
          });
        }
        setPlaylists(picks);
      } catch (err) {
        if (!cancelled) {
          setPlaylistError(
            err instanceof Error ? err.message : "Failed to load playlists"
          );
        }
      } finally {
        if (!cancelled) setLoadingPlaylists(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[min(720px,95%)] max-h-[80vh] overflow-auto bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add to schedule</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 p-1 rounded hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
          <button
            type="button"
            onClick={() => setTab("audio")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${
              tab === "audio"
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Music size={14} />
            Assign track
          </button>
          <button
            type="button"
            onClick={() => setTab("playlist")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${
              tab === "playlist"
                ? "bg-[#A473FF] text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ListMusic size={14} />
            Assign playlist
          </button>
        </div>

        {tab === "audio" ? (
          <div className="space-y-2">
            {audio.length === 0 && (
              <div className="text-sm text-gray-500">No audio in library</div>
            )}
            {audio.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-sm">{a.title}</div>
                  <div className="text-xs text-gray-400">{a.duration} min</div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAudio(a)}
                  className="px-3 py-1 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {loadingPlaylists && (
              <div className="text-sm text-gray-500 py-4 text-center">
                Loading playlists…
              </div>
            )}
            {playlistError && (
              <div className="text-sm text-red-600 py-2">{playlistError}</div>
            )}
            {!loadingPlaylists && !playlistError && playlists.length === 0 && (
              <div className="text-sm text-gray-500 py-4 text-center">
                No playlists yet. Create one in Library → Playlists.
              </div>
            )}
            {playlists.map((pl) => (
              <div
                key={pl.playlistId}
                className="flex items-center justify-between p-3 rounded-lg border border-purple-100 bg-purple-50/40 hover:bg-purple-50"
              >
                <div>
                  <div className="font-medium text-sm text-gray-900">{pl.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {pl.trackCount} {pl.trackCount === 1 ? "track" : "tracks"} ·{" "}
                    {pl.totalDuration}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pl.trackCount < 1}
                  onClick={() => onSelectPlaylist(pl)}
                  className="px-3 py-1 rounded-md bg-[#A473FF] text-white text-sm hover:bg-[#7A42FF] disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
