"use client";

import { useCallback, useState } from "react";
import type { getApiClient } from "@/lib/api-client";
import type { PlayerViewModel } from "../types";

type ApiClientInstance = ReturnType<typeof getApiClient>;

export function usePlayerDeleteModal({
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
}: {
  apiClient: ApiClientInstance;
  players: PlayerViewModel[];
  isSuperAdmin: boolean;
  workspaceTenantId: string | null;
  applyViewTenantScope: () => void;
  loadPlayersFromApi: (options?: { refresh?: boolean }) => Promise<PlayerViewModel[]>;
  notifyPlayersUpdated: (count: number) => void;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  setLoadError: React.Dispatch<React.SetStateAction<string | null>>;
  setPlayers: React.Dispatch<React.SetStateAction<PlayerViewModel[]>>;
  setSuccessToast: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [playerToDelete, setPlayerToDelete] = useState<PlayerViewModel | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const requestDelete = useCallback((player: PlayerViewModel) => {
    setPlayerToDelete(player);
    setDeleteOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deleteLoading) return;
    setDeleteOpen(false);
    setPlayerToDelete(null);
  }, [deleteLoading]);

  const confirmDelete = useCallback(
    async (playerId: string) => {
      setDeleteLoading(true);
      setLoadError(null);
      try {
        const target = playerToDelete ?? players.find((p) => p.id === playerId);
        if (target?.tenantId) {
          apiClient.setWorkspaceTenant(target.tenantId);
        } else if (isSuperAdmin && workspaceTenantId) {
          apiClient.setWorkspaceTenant(workspaceTenantId);
        }

        await apiClient.deletePlayer(playerId);
        setEditingId(null);
        setPlayers((prev) => {
          const next = prev.filter((p) => p.id !== playerId);
          notifyPlayersUpdated(next.length);
          return next;
        });
        await loadPlayersFromApi({ refresh: true });
        const name = target?.roomName ?? "Player";
        setSuccessToast(`Deleted player: ${name}`);
        setDeleteOpen(false);
        setPlayerToDelete(null);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } } };
        setLoadError(ax?.response?.data?.error || "Failed to delete player");
      } finally {
        applyViewTenantScope();
        setDeleteLoading(false);
      }
    },
    [
      apiClient,
      applyViewTenantScope,
      isSuperAdmin,
      loadPlayersFromApi,
      notifyPlayersUpdated,
      playerToDelete,
      players,
      setEditingId,
      setLoadError,
      setPlayers,
      setSuccessToast,
      workspaceTenantId,
    ]
  );

  return {
    playerToDelete,
    deleteOpen,
    deleteLoading,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
  };
}
