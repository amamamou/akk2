"use client";

import { useCallback, useState } from "react";
import type { useRouter } from "next/navigation";
import type { Playlist } from "@/app/library/components/PlaylistModal";
import type { getApiClient } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { isValidPlaylistId } from "@/lib/playlist-mapper";

type ApiClientInstance = ReturnType<typeof getApiClient>;

export function usePlaylistDeleteModal({
  apiClient,
  router,
  setError,
  onDeleted,
}: {
  apiClient: ApiClientInstance;
  router?: ReturnType<typeof useRouter>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  onDeleted?: (playlistId: string) => void | Promise<void>;
}) {
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const requestDelete = useCallback((item: Playlist) => {
    setPlaylistToDelete(item);
    setDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setPlaylistToDelete(null);
  }, [deleteLoading]);

  const confirmDelete = useCallback(
    async (playlistId: string) => {
      if (!isValidPlaylistId(playlistId)) return;

      setDeleteLoading(true);
      try {
        await apiClient.deletePlaylist(playlistId);
        setDeleteOpen(false);
        setPlaylistToDelete(null);
        if (onDeleted) {
          await onDeleted(playlistId);
        } else {
          router?.push("/library/playlists");
        }
      } catch (err) {
        setError(formatApiError(err, "Failed to delete playlist"));
      } finally {
        setDeleteLoading(false);
      }
    },
    [apiClient, onDeleted, router, setError]
  );

  return {
    playlistToDelete,
    deleteOpen,
    deleteLoading,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
  };
}
