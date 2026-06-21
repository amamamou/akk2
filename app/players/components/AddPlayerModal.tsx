"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Radio, Wifi, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import { toActiveWorkspaceClients, type WorkspaceClientOption } from "@/lib/workspace-clients";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  /** When set, player is always created in this workspace (selector hidden). */
  lockedClientId?: string;
  onSubmit: (data: {
    name: string;
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
    clientId?: string;
    tenantId?: string;
  }) => Promise<void>;
}

function resetForm(setters: {
  setName: (v: string) => void;
  setLocationName: (v: string) => void;
  setIpAddress: (v: string) => void;
  setDeviceId: (v: string) => void;
  setSubmitError: (v: string | null) => void;
  setSelectedClientId: (v: string) => void;
  defaultClientId: string;
}) {
  setters.setName("");
  setters.setLocationName("");
  setters.setIpAddress("");
  setters.setDeviceId("");
  setters.setSubmitError(null);
  setters.setSelectedClientId(setters.defaultClientId);
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  onSubmit,
  defaultClientId = "",
  lockedClientId,
}: AddPlayerModalProps) {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const requireClientSelection = isSuperAdmin;
  const clientSelectionLocked = Boolean(lockedClientId);

  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !isSuperAdmin) return;

    let cancelled = false;
    setClientsLoading(true);
    setClientsError(null);

    void (async () => {
      try {
        const res = await getApiClient().listClients();
        if (cancelled) return;
        const eligible = toActiveWorkspaceClients(res?.clients ?? []);
        setWorkspaceClients(eligible);
        const preferredClientId = lockedClientId || defaultClientId;
        if (preferredClientId && eligible.some((c) => c.id === preferredClientId)) {
          setSelectedClientId(preferredClientId);
        } else if (eligible.length > 0) {
          setSelectedClientId(eligible[0].id);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setClientsError(ax?.response?.data?.error || "Failed to load clients");
        setWorkspaceClients([]);
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isSuperAdmin, defaultClientId, lockedClientId]);

  const effectiveClientId = lockedClientId || defaultClientId;

  useEffect(() => {
    if (!isOpen) return;
    resetForm({
      setName,
      setLocationName,
      setIpAddress,
      setDeviceId,
      setSubmitError,
      setSelectedClientId,
      defaultClientId: effectiveClientId,
    });
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [isOpen, effectiveClientId]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    resetForm({
      setName,
      setLocationName,
      setIpAddress,
      setDeviceId,
      setSubmitError,
      setSelectedClientId,
      defaultClientId: effectiveClientId,
    });
    onClose();
  }, [isLoading, effectiveClientId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const selectedClient = workspaceClients.find((c) => c.id === selectedClientId);
  const canSubmit =
    name.trim().length > 0 &&
    (!requireClientSelection ||
      (!clientsLoading && Boolean(selectedClientId) && workspaceClients.length > 0));

  const handleSubmit = async () => {
    if (requireClientSelection && !selectedClient) {
      setSubmitError("Select a client workspace before adding a player.");
      return;
    }
    if (!name.trim()) {
      setSubmitError("Player name is required.");
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: name.trim(),
        locationName: locationName.trim() || undefined,
        ipAddress: ipAddress.trim() || undefined,
        deviceId: deviceId.trim() || undefined,
        clientId: selectedClient?.id,
        tenantId: selectedClient?.tenantId,
      });
      resetForm({
        setName,
        setLocationName,
        setIpAddress,
        setDeviceId,
        setSubmitError,
        setSelectedClientId,
        defaultClientId: effectiveClientId,
      });
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(
        ax?.response?.data?.error ||
          (err instanceof Error ? err.message : "Failed to add player. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-player-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden sm:max-h-none",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn(dashboardIconChip, "h-8 w-8 rounded-lg")}>
                <Radio size={15} className="text-[#8B5CF6]" strokeWidth={2} />
              </div>
              <span className={dashboardSectionLabel}>Device fleet</span>
            </div>
            <h2 id="add-player-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Add player
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-sm")}>
              Name the device, set its location, and optionally add network details.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {requireClientSelection && !clientSelectionLocked ? (
            <div className="mb-5">
              <label htmlFor="add-player-client" className={dashboardSectionLabel}>
                Client workspace
              </label>
              <select
                id="add-player-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={cn(INPUT_CLASS, "appearance-none")}
                disabled={isLoading || clientsLoading || workspaceClients.length === 0}
              >
                <option value="" disabled>
                  {clientsLoading ? "Loading clients…" : "Choose a client…"}
                </option>
                {workspaceClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {clientsError ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {clientsError}
                </p>
              ) : null}
              {!clientsLoading && workspaceClients.length === 0 && !clientsError ? (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  No active client workspaces are available.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label htmlFor="add-player-name" className={dashboardSectionLabel}>
                Name
              </label>
              <input
                ref={nameInputRef}
                id="add-player-name"
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit && !isLoading) void handleSubmit();
                }}
                placeholder="e.g. Lobby speaker"
                className={INPUT_CLASS}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="add-player-location" className={dashboardSectionLabel}>
                Location
                <span className="ml-1 normal-case tracking-normal text-gray-400">
                  (optional)
                </span>
              </label>
              <input
                id="add-player-location"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Reception area"
                className={INPUT_CLASS}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Wifi size={14} className="text-gray-400" />
              <span className={dashboardSectionLabel}>Device details</span>
              <span className="text-[10px] font-medium normal-case tracking-normal text-gray-400">
                (optional)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="add-player-ip" className={dashboardSectionLabel}>
                  IP address
                </label>
                <input
                  id="add-player-ip"
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.1.100"
                  className={INPUT_CLASS}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="add-player-device" className={dashboardSectionLabel}>
                  Device ID
                </label>
                <input
                  id="add-player-device"
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="DEVICE-12345"
                  className={INPUT_CLASS}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {submitError ? (
            <p className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-400">
              {submitError}
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-zinc-700/60">
          <p className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">
            <Radio size={12} />
            Device appears in fleet after registration
          </p>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <X size={15} strokeWidth={2} className="shrink-0 opacity-70" />
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || isLoading}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium transition-opacity",
                canSubmit && !isLoading
                  ? "text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
              style={
                canSubmit && !isLoading
                  ? {
                      background:
                        "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
                    }
                  : undefined
              }
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="shrink-0 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus size={16} strokeWidth={2} className="shrink-0" />
                  Add 
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
