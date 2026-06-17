"use client";

import React, { useEffect, useState } from "react";
import { ListMusic, Music, X } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import type { MediaInfo, PlaylistApiInfo } from "@/types/api";
import { apiPlaylistToUi } from "@/lib/playlist-mapper";
import { frenchDemoTenantSlug } from "@/lib/french-demo-seed";
import { useAuth } from "@/app/context/AuthContext";
import { isSuperAdminRole } from "@/lib/rbac";
import {
  GLOBAL_ADMIN_TENANT_ID,
  dedupeById,
  dedupeByKey,
  filterSuperAdminCatalog,
} from "@/lib/global-admin-tenant";

type AudioItem = { id: string; title: string; duration: number; type: string; url?: string };

export type PlaylistPick = {
  playlistId: string;
  title: string;
  trackCount: number;
  totalDuration: string;
  tenantId?: string;
};

type Tab = "audio" | "playlist";

function mapMediaRow(m: MediaInfo): AudioItem {
  return {
    id: m.id,
    title: m.title,
    duration:
      m.durationMinutes && m.durationMinutes > 0 ? m.durationMinutes : 60,
    type: m.category || "Audio",
    url: m.url,
  };
}

export default function ScheduleAssignModal({
  open,
  onClose,
  workspaceTenantId,
  onSelectAudio,
  onSelectPlaylist,
}: {
  open: boolean;
  onClose: () => void;
  /** Active client workspace tenant UUID — required for scoped media/playlist fetch. */
  workspaceTenantId: string | null;
  onSelectAudio: (item: AudioItem, loopPlayback: boolean) => void;
  onSelectPlaylist: (item: PlaylistPick, loopPlayback: boolean) => void;
}) {
  const { user } = useAuth();
  const isSuperAdminUser = isSuperAdminRole(user?.role);

  const [tab, setTab] = useState<Tab>("audio");
  const [loopPlayback, setLoopPlayback] = useState(false);
  const [audio, setAudio] = useState<AudioItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistPick[]>([]);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  const fetchWorkspaceCatalog = React.useCallback(
    async (tenantId: string) => {
      const api = getApiClient();
      const workspaceSlug = frenchDemoTenantSlug(tenantId);
      api.setWorkspaceTenant(tenantId, workspaceSlug);

      setLoadingAudio(true);
      setLoadingPlaylists(true);
      setAudioError(null);
      setPlaylistError(null);

      const loadMediaForTenant = async (tid: string): Promise<MediaInfo[]> => {
        api.setWorkspaceTenant(tid, frenchDemoTenantSlug(tid));
        const res = await api.listMedia();
        return res.media ?? [];
      };

      const loadPlaylistsForTenant = async (
        tid: string
      ): Promise<PlaylistPick[]> => {
        api.setWorkspaceTenant(tid, frenchDemoTenantSlug(tid));
        const res = await api.listPlaylists();
        const picks: PlaylistPick[] = [];
        for (const row of res.playlists ?? []) {
          const ui = apiPlaylistToUi(row as PlaylistApiInfo);
          if (!ui) continue;
          picks.push({
            playlistId: ui.id,
            title: ui.title,
            trackCount: ui.trackCount,
            totalDuration: ui.totalDuration,
            tenantId: row.tenantId ?? row.tenant_id,
          });
        }
        return picks;
      };

      try {
        let mediaRows = await loadMediaForTenant(tenantId);
        if (isSuperAdminUser && tenantId !== GLOBAL_ADMIN_TENANT_ID) {
          const adminRows = await loadMediaForTenant(GLOBAL_ADMIN_TENANT_ID);
          mediaRows = dedupeById([...mediaRows, ...adminRows]);
        }
        const visibleMedia = filterSuperAdminCatalog(
          mediaRows.map((m) => ({
            ...m,
            tenantId: m.tenantId ?? m.tenant_id,
          })),
          tenantId,
          isSuperAdminUser
        );
        setAudio(visibleMedia.map(mapMediaRow));
      } catch (err) {
        setAudio([]);
        setAudioError(
          err instanceof Error ? err.message : "Failed to load audio for workspace"
        );
      } finally {
        setLoadingAudio(false);
        api.setWorkspaceTenant(tenantId, workspaceSlug);
      }

      try {
        let playlistRows = await loadPlaylistsForTenant(tenantId);
        if (isSuperAdminUser && tenantId !== GLOBAL_ADMIN_TENANT_ID) {
          const adminPlaylists = await loadPlaylistsForTenant(GLOBAL_ADMIN_TENANT_ID);
          playlistRows = dedupeByKey(
            [...playlistRows, ...adminPlaylists],
            (p) => p.playlistId
          );
        }
        const visiblePlaylists = filterSuperAdminCatalog(
          playlistRows,
          tenantId,
          isSuperAdminUser
        );
        setPlaylists(visiblePlaylists);
      } catch (err) {
        setPlaylists([]);
        setPlaylistError(
          err instanceof Error ? err.message : "Failed to load playlists for workspace"
        );
      } finally {
        setLoadingPlaylists(false);
        api.setWorkspaceTenant(tenantId, workspaceSlug);
      }
    },
    [isSuperAdminUser]
  );

  useEffect(() => {
    if (!open || !workspaceTenantId) {
      setAudio([]);
      setPlaylists([]);
      return;
    }

    let cancelled = false;
    void fetchWorkspaceCatalog(workspaceTenantId).finally(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [open, workspaceTenantId, fetchWorkspaceCatalog]);

  if (!open) return null;

  const needsWorkspace = !workspaceTenantId;

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

        {needsWorkspace ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            Select a client workspace above before assigning audio or playlists.
          </p>
        ) : (
          <>
            {isSuperAdminUser && (
              <p className="mb-3 text-xs text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                Super Admin view: global template tracks and playlists from the master
                catalog are included for assignment.
              </p>
            )}
            <label className="flex items-center justify-between gap-3 mb-4 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">Loop playback</p>
                <p className="text-xs text-gray-500">Repeat audio continuously within this time slot</p>
              </div>
              <input
                type="checkbox"
                checked={loopPlayback}
                onChange={(e) => setLoopPlayback(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#A473FF] focus:ring-[#A473FF]"
                aria-label="Loop playback"
              />
            </label>
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
                {loadingAudio && (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    Loading audio for workspace…
                  </div>
                )}
                {audioError && (
                  <div className="text-sm text-red-600 py-2">{audioError}</div>
                )}
                {!loadingAudio && !audioError && audio.length === 0 && (
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
                      onClick={() => onSelectAudio(a, loopPlayback)}
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
                {!loadingPlaylists &&
                  !playlistError &&
                  playlists.length === 0 && (
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
                      <div className="font-medium text-sm text-gray-900">
                        {pl.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {pl.trackCount}{" "}
                        {pl.trackCount === 1 ? "track" : "tracks"} ·{" "}
                        {pl.totalDuration}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={pl.trackCount < 1}
                      onClick={() => onSelectPlaylist(pl, loopPlayback)}
                      className="px-3 py-1 rounded-md bg-[#A473FF] text-white text-sm hover:bg-[#7A42FF] disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
