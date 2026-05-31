"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import {
  toActiveWorkspaceClients,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";
import type { PlayerInfo } from "@/types/api";
import AdminHeader from "../components/AdminHeader";
import AdminTable, { Column } from "../components/AdminTable";
import AddPlayerModal from "@/app/players/components/AddPlayerModal";
import { Edit3, FileText, Loader2 } from "lucide-react";

type PlayerRow = {
  id: string;
  name: string;
  deviceId: string;
  location: string;
  client?: string;
  status: "online" | "offline";
  ip?: string;
  currentAudio?: string;
  lastActive?: string;
};

function formatLastActive(lastSeen?: string | null): string {
  if (!lastSeen) return "—";
  const ms = new Date(lastSeen).getTime();
  if (Number.isNaN(ms)) return "—";
  const diffMin = Math.floor((Date.now() - ms) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return new Date(lastSeen).toLocaleDateString();
}

function mapPlayerToRow(p: PlayerInfo, clientName?: string): PlayerRow {
  const meta = (p.metadata ?? {}) as Record<string, unknown>;
  const lastSeenMs = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
  const isOnline = Boolean(lastSeenMs && Date.now() - lastSeenMs <= 2 * 60 * 1000);
  return {
    id: p.id,
    name: p.playerName || p.roomName || "Unnamed",
    deviceId: String(meta.deviceId ?? meta.device_id ?? p.macAddress ?? "—"),
    location: p.roomName || String(meta.location ?? "—"),
    client: clientName,
    status: isOnline ? "online" : "offline",
    ip: String(meta.ipAddress ?? meta.ip_address ?? "—"),
    currentAudio: p.nowPlaying?.title ?? "—",
    lastActive: formatLastActive(p.lastSeen),
  };
}

function StatusBadge({ s }: { s: "online" | "offline" }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${
        s === "online" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {s}
    </span>
  );
}

export default function PlayersClient() {
  const apiClient = getApiClient();
  const { user, isLoading: authLoading } = useAuth();
  const isSuperAdmin = String(user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>(
    []
  );
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] =
    useState("");
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(null);

  const clientNameByTenantId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of workspaceClients) {
      map[c.tenantId] = c.name;
    }
    return map;
  }, [workspaceClients]);

  useEffect(() => {
    if (!isSuperAdmin || authLoading) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.listClients();
        if (cancelled) return;
        const eligible = toActiveWorkspaceClients(res?.clients ?? []);
        setWorkspaceClients(eligible);
        if (eligible.length > 0 && !selectedWorkspaceClientId) {
          setSelectedWorkspaceClientId(eligible[0].id);
          setWorkspaceTenantId(eligible[0].tenantId);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax?.response?.data?.error || "Failed to load clients");
      }
    })();

    return () => {
      cancelled = true;
      apiClient.clearWorkspaceTenant();
    };
  }, [apiClient, isSuperAdmin, authLoading]);

  const loadPlayers = useCallback(async () => {
    if (isSuperAdmin && !workspaceTenantId) {
      setRows([]);
      setPageLoading(false);
      return;
    }

    if (isSuperAdmin && workspaceTenantId) {
      apiClient.setWorkspaceTenant(workspaceTenantId);
    }

    setPageLoading(true);
    setError(null);

    try {
      const res = await apiClient.getPlayers();
      const clientLabel = isSuperAdmin
        ? clientNameByTenantId[workspaceTenantId ?? ""] ??
          workspaceClients.find((c) => c.tenantId === workspaceTenantId)?.name
        : undefined;
      const mapped = (res.players ?? []).map((p) =>
        mapPlayerToRow(p, clientLabel)
      );
      setRows(mapped);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("akou:players-updated", { detail: { count: mapped.length } })
        );
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax?.response?.data?.error || "Failed to load players");
      setRows([]);
    } finally {
      setPageLoading(false);
    }
  }, [
    apiClient,
    isSuperAdmin,
    workspaceTenantId,
    clientNameByTenantId,
    workspaceClients,
  ]);

  useEffect(() => {
    if (authLoading) return;
    void loadPlayers();
  }, [authLoading, loadPlayers]);

  const handleWorkspaceChange = (clientId: string) => {
    const match = workspaceClients.find((c) => c.id === clientId);
    if (!match) return;
    setSelectedWorkspaceClientId(clientId);
    setWorkspaceTenantId(match.tenantId);
  };

  const handleAddPlayer = async (data: {
    name: string;
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
    tenantId?: string;
    clientId?: string;
  }) => {
    if (isSuperAdmin) {
      if (!data.tenantId) {
        throw new Error("Select a client workspace before creating a player.");
      }
      apiClient.setWorkspaceTenant(data.tenantId);
      if (data.clientId) {
        setSelectedWorkspaceClientId(data.clientId);
        setWorkspaceTenantId(data.tenantId);
      }
    }

    setActionLoading(true);
    try {
      await apiClient.createPlayer({
        name: data.name,
        macAddress: "",
        locationName: data.locationName,
        ipAddress: data.ipAddress,
        deviceId: data.deviceId,
        tenantId: data.tenantId,
        clientId: data.clientId,
      });
      await loadPlayers();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlayers = async (ids: string[]) => {
    if (ids.length === 0) return;
    setActionLoading(true);
    setError(null);
    try {
      for (const id of ids) {
        await apiClient.deletePlayer(id);
      }
      setSelected([]);
      await loadPlayers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax?.response?.data?.error || "Failed to delete player");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((p) =>
      `${p.name} ${p.location} ${p.client ?? ""} ${p.deviceId}`
        .toLowerCase()
        .includes(t)
    );
  }, [q, rows]);

  const columns: Column<PlayerRow>[] = [
    {
      key: "name",
      label: "Player Name",
      render: (r) => (
        <div className="truncate">
          <span className="font-medium text-gray-900">{r.name}</span>
        </div>
      ),
    },
    { key: "deviceId", label: "Device ID", render: (r) => <span className="text-gray-600">{r.deviceId}</span> },
    { key: "location", label: "Location", render: (r) => <span className="text-gray-600">{r.location}</span> },
    { key: "client", label: "Client", render: (r) => <span className="text-gray-600">{r.client ?? "—"}</span> },
    { key: "status", label: "Status", render: (r) => <StatusBadge s={r.status} /> },
    { key: "ip", label: "IP Address", render: (r) => <span className="text-gray-600">{r.ip ?? "—"}</span> },
    {
      key: "currentAudio",
      label: "Current Audio",
      render: (r) => <span className="text-gray-600">{r.currentAudio ?? "—"}</span>,
    },
    {
      key: "lastActive",
      label: "Last Active",
      render: (r) => <span className="text-gray-600">{r.lastActive ?? "—"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-24",
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            title="View player"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <FileText size={16} />
          </button>
          <button
            type="button"
            title="Edit player"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Edit3 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const workspaceBlocked = isSuperAdmin && !workspaceTenantId;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <AdminHeader
        title="Players"
        subtitle="Manage playback endpoints via live API"
        onAdd={() => setAddOpen(true)}
        searchValue={q}
        setSearchValue={setQ}
      />

      {isSuperAdmin && (
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
          <label
            htmlFor="admin-players-workspace"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0"
          >
            Client Workspace
          </label>
          <select
            id="admin-players-workspace"
            value={selectedWorkspaceClientId}
            onChange={(e) => handleWorkspaceChange(e.target.value)}
            className="max-w-md flex-1 text-sm px-3 py-1.5 rounded-md bg-violet-50 border border-violet-100"
          >
            <option value="" disabled>
              Choose a client…
            </option>
            {workspaceClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto relative">
        {(pageLoading || actionLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
        <div className="px-6 py-4">
          {workspaceBlocked ? (
            <p className="text-sm text-gray-500 py-12 text-center">
              Select a client workspace to load and manage players.
            </p>
          ) : (
            <AdminTable
              columns={columns}
              rows={filtered}
              selected={selected}
              onSelect={(id, checked) =>
                setSelected((s) =>
                  checked ? [...s, id] : s.filter((x) => x !== id)
                )
              }
              onSelectAll={(checked) =>
                setSelected(checked ? filtered.map((r) => r.id) : [])
              }
              onRowClick={() => {}}
              onDeleteSelected={(ids) => void handleDeletePlayers(ids)}
            />
          )}
        </div>
      </div>

      <AddPlayerModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddPlayer}
        defaultClientId={selectedWorkspaceClientId}
      />
    </div>
  );
}
