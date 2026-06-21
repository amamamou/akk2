"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import ModalFooterActions from "@/app/clients/components/ModalFooterActions";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import { STATUS_CONFIG } from "../lib/player-status";
import type { PlayerViewModel } from "../types";

export default function DeletePlayerModal({
  open,
  player,
  onClose,
  onConfirm,
  isDeleting = false,
}: {
  open: boolean;
  player: PlayerViewModel | null;
  onClose: () => void;
  onConfirm: (playerId: string) => Promise<void>;
  isDeleting?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, isDeleting]);

  if (!open || !player) return null;

  const statusLabel = STATUS_CONFIG[player.status].label;
  const locationLabel = player.locationName || player.playerName;
  const detailParts = [player.clientName, locationLabel, statusLabel].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-player-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div
                className={cn(
                  dashboardIconChip,
                  "h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40"
                )}
              >
                <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400" strokeWidth={2} />
              </div>
              <span className={dashboardSectionLabel}>Danger zone</span>
            </div>
            <h2 id="delete-player-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Delete player
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1")}>
              This action cannot be undone. The player will be removed from your fleet and its
              current playback state will be lost.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5">
          <p className={dashboardSectionLabel}>Player to delete</p>
          <div
            className={cn(
              dashboardCardClass,
              "mt-3 border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20"
            )}
          >
            <p className="font-medium text-gray-900 dark:text-zinc-100">{player.roomName}</p>
            {detailParts.length > 0 ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                {detailParts.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        <ModalFooterActions
          onCancel={onClose}
          cancelDisabled={isDeleting}
          primaryLabel="Delete player"
          primaryLoadingLabel="Deleting…"
          primaryIcon={<Trash2 size={16} strokeWidth={2} />}
          onPrimary={() => void onConfirm(player.id)}
          primaryLoading={isDeleting}
          primaryVariant="danger"
        />
      </div>
    </div>
  );
}
