"use client";

import { useCallback, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { AudioItem } from "@/app/library/components/AudioTile";
import type { getApiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

type ApiClientInstance = ReturnType<typeof getApiClient>;

export function useAudioDeleteModal({
  apiClient,
  queryClient,
  activeTrackId,
  stopPreview,
  setError,
  setSuccessToast,
}: {
  apiClient: ApiClientInstance;
  queryClient: QueryClient;
  activeTrackId: string | null;
  stopPreview: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessToast: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [audioToDelete, setAudioToDelete] = useState<AudioItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const requestDelete = useCallback((item: AudioItem) => {
    setAudioToDelete(item);
    setDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setAudioToDelete(null);
  }, [deleteLoading]);

  const confirmDelete = useCallback(
    async (audioId: string) => {
      setDeleteLoading(true);
      try {
        if (activeTrackId === audioId) stopPreview();
        await apiClient.deleteMedia(audioId);
        await queryClient.invalidateQueries({ queryKey: queryKeys.media() });
        const name = audioToDelete?.title ?? "Audio";
        setSuccessToast(`Deleted audio: ${name}`);
        setDeleteOpen(false);
        setAudioToDelete(null);
      } catch {
        setError("Failed to delete audio. Please try again.");
      } finally {
        setDeleteLoading(false);
      }
    },
    [
      activeTrackId,
      apiClient,
      audioToDelete?.title,
      queryClient,
      setError,
      setSuccessToast,
      stopPreview,
    ]
  );

  return {
    audioToDelete,
    deleteOpen,
    deleteLoading,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
  };
}
