"use client";

import { useCallback, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Playlist } from "@/app/library/components/PlaylistModal";
import { formatApiError } from "@/lib/format-api-error";
import {
  apiPlaylistToUi,
  isValidPlaylistId,
  normalizePlaylistTracks,
} from "@/lib/playlist-mapper";
import type { PlaylistTrackInfo } from "@/types/api";

type RemovePlaylistItemResponse = {
  playlist: Parameters<typeof apiPlaylistToUi>[0];
};

export function useRemovePlaylistTrackModal({
  activePlaylistId,
  playlistTitle,
  activeTrackId,
  stopPreview,
  removePlaylistItemMutation,
  setPlaylist,
  setTracks,
  setError,
  setSuccessToast,
}: {
  activePlaylistId: string;
  playlistTitle?: string;
  activeTrackId: string | null;
  stopPreview: () => void;
  removePlaylistItemMutation: UseMutationResult<
    RemovePlaylistItemResponse,
    unknown,
    { playlistId: string; itemId: string }
  >;
  setPlaylist: React.Dispatch<React.SetStateAction<Playlist | null>>;
  setTracks: React.Dispatch<React.SetStateAction<PlaylistTrackInfo[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessToast: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [trackToRemove, setTrackToRemove] = useState<PlaylistTrackInfo | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const requestRemove = useCallback((track: PlaylistTrackInfo) => {
    setTrackToRemove(track);
    setRemoveOpen(true);
  }, []);

  const closeRemoveModal = useCallback(() => {
    if (removeLoading) return;
    setRemoveOpen(false);
    setTrackToRemove(null);
  }, [removeLoading]);

  const confirmRemove = useCallback(
    async (itemId: string) => {
      if (!isValidPlaylistId(activePlaylistId)) {
        setError("Cannot remove track — playlist ID is missing.");
        return;
      }
      if (!itemId?.trim()) {
        setError("Cannot remove track — invalid item ID from server.");
        return;
      }

      setRemoveLoading(true);
      try {
        if (activeTrackId === itemId) stopPreview();

        const res = await removePlaylistItemMutation.mutateAsync({
          playlistId: activePlaylistId,
          itemId,
        });
        const ui = apiPlaylistToUi(res.playlist);
        setPlaylist(ui);
        setTracks(normalizePlaylistTracks(res.playlist.tracks));
        setSuccessToast("Track removed");
        setRemoveOpen(false);
        setTrackToRemove(null);
      } catch (err) {
        setError(formatApiError(err, "Failed to remove track"));
      } finally {
        setRemoveLoading(false);
      }
    },
    [
      activePlaylistId,
      activeTrackId,
      removePlaylistItemMutation,
      setError,
      setPlaylist,
      setSuccessToast,
      setTracks,
      stopPreview,
    ]
  );

  return {
    trackToRemove,
    removeOpen,
    removeLoading,
    playlistTitle,
    requestRemove,
    closeRemoveModal,
    confirmRemove,
  };
}
