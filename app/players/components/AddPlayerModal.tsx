"use client";

import React, { useEffect, useRef, useState } from "react";
import { Building2, X, MapPin, Wifi, Cpu } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import { toActiveWorkspaceClients, type WorkspaceClientOption } from "@/lib/workspace-clients";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  onSubmit: (data: {
    name: string;
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
    clientId?: string;
    tenantId?: string;
  }) => Promise<void>;
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  onSubmit,
  defaultClientId = "",
}: AddPlayerModalProps) {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";
  const requireClientSelection = isSuperAdmin;

  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);
  const [isLoading, setIsLoading] = useState(false);
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
        if (defaultClientId && eligible.some((c) => c.id === defaultClientId)) {
          setSelectedClientId(defaultClientId);
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
  }, [isOpen, isSuperAdmin, defaultClientId]);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultClientId) {
      setSelectedClientId(defaultClientId);
    }
  }, [isOpen, defaultClientId]);

  const selectedClient = workspaceClients.find((c) => c.id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requireClientSelection && !selectedClient) {
      alert("Please select a client workspace");
      return;
    }

    if (!name.trim()) {
      alert("Player name is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        locationName: locationName.trim() || undefined,
        ipAddress: ipAddress.trim() || undefined,
        deviceId: deviceId.trim() || undefined,
        clientId: selectedClient?.id,
        tenantId: selectedClient?.tenantId,
      });

      setName("");
      setLocationName("");
      setIpAddress("");
      setDeviceId("");
      onClose();
    } catch (error) {
      console.error("Failed to add player:", error);
      const msg =
        (error as { message?: string })?.message ||
        "Failed to add player. Please try again.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Player</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {requireClientSelection && (
            <div>
              <label
                htmlFor="add-player-client"
                className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2"
              >
                <Building2 size={16} className="text-gray-500" />
                Client Workspace *
              </label>
              <select
                id="add-player-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-violet-200 bg-violet-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
                disabled={isLoading || clientsLoading || workspaceClients.length === 0}
                required
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
              {clientsError && (
                <p className="text-xs text-red-600 mt-1">{clientsError}</p>
              )}
              {!clientsLoading && workspaceClients.length === 0 && !clientsError && (
                <p className="text-xs text-amber-700 mt-1">
                  No active clients with a linked tenant are available.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Player Name *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lobby Speaker"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              Location Name
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Reception Area"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              <Wifi size={16} className="text-gray-500" />
              IP Address
            </label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g. 192.168.1.100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              <Cpu size={16} className="text-gray-500" />
              Device ID
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. DEVICE-12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#A473FF] text-white rounded-md text-sm font-medium hover:brightness-90 disabled:opacity-50"
              disabled={
                isLoading ||
                !name.trim() ||
                (requireClientSelection &&
                  (clientsLoading ||
                    !selectedClientId ||
                    workspaceClients.length === 0))
              }
            >
              {isLoading ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
