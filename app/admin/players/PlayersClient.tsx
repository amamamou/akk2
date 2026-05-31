"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import {
  toActiveWorkspaceClients,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";
import { ALL_CLIENTS_WORKSPACE_ID } from "@/lib/demo-workspaces";
import type { PlayerInfo } from "@/types/api";
import AdminHeader from "../components/AdminHeader";
import AdminTable, { Column } from "../components/AdminTable";
import AddPlayerModal from "@/app/players/components/AddPlayerModal";
import { ChevronDown, Edit3, FileText, Loader2 } from "lucide-react";

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

type ClientPlayerGroup = {
  clientId: string;
  clientName: string;
  tenantId: string;
  players: PlayerRow[];
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
  const [clientGroups, setClientGroups] = useState<ClientPlayerGroup[]>([]);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>(
    {}
  );
  const [addOpen, setAddOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceClients, setWorkspaceClients] = useState<WorkspaceClientOption[]>(
    []
  );
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] =
    useState(ALL_CLIENTS_WORKSPACE_ID);
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(null);

  const showAllClients =
    isSuperAdmin && selectedWorkspaceClientId === ALL_CLIENTS_WORKSPACE_ID;

  useEffect(() => {
    if (!isSuperAdmin || authLoading) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.listClients();
        if (cancelled) return;
        const eligible = toActiveWorkspaceClients(res?.clients ?? []);
        setWorkspaceClients(eligible);
        setExpandedClients((prev) => {
          const next = { ...prev };
          for (const c of eligible) {
            if (next[c.id] === undefined) next[c.id] = true;
          }
          return next;
        });
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax?.response?.data?.error || "Failed to load clients");
        setWorkspaceClients([]);
      }
    })();

    return () => {
      cancelled = true;
      apiClient.clearWorkspaceTenant();
    };
  }, [apiClient, isSuperAdmin, authLoading]);

  const loadPlayersForTenant = useCallback(
    async (tenantId: string, clientName: string, clientId: string) => {
      apiClient.setWorkspaceTenant(tenantId);
      const res = await apiClient.getPlayers();
      return (res.players ?? []).map((p) => mapPlayerToRow(p, clientName));
    },
    [apiClient]
  );

  const loadPlayers = useCallback(async () => {
    if (!isSuperAdmin) {
      setPageLoading(true);
      setError(null);
      try {
        const res = await apiClient.getPlayers();
        setRows((res.players ?? []).map((p) => mapPlayerToRow(p)));
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax?.response?.data?.error || "Failed to load players");
        setRows([]);
      } finally {
        setPageLoading(false);
      }
      return;
    }

    if (showAllClients) {
      if (workspaceClients.length === 0) {
        setClientGroups([]);
        setRows([]);
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      setError(null);
      try {
        const groups: ClientPlayerGroup[] = [];
        for (const client of workspaceClients) {
          const players = await loadPlayersForTenant(
            client.tenantId,
            client.name,
            client.id
          );
          groups.push({
            clientId: client.id,
            clientName: client.name,
            tenantId: client.tenantId,
            players,
          });
        }
        setClientGroups(groups);
        setRows(groups.flatMap((g) => g.players));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("akou:players-updated", {
              detail: { count: groups.reduce((n, g) => n + g.players.length, 0) },
            })
          );
        }
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax?.response?.data?.error || "Failed to load players");
        setClientGroups([]);
        setRows([]);
      } finally {
        setPageLoading(false);
      }
      return;
    }

    if (!workspaceTenantId) {
      setRows([]);
      setClientGroups([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setError(null);
    try {
      const client = workspaceClients.find(
        (c) => c.id === selectedWorkspaceClientId
      );
      const mapped = await loadPlayersForTenant(
        workspaceTenantId,
        client?.name ?? "Client",
        selectedWorkspaceClientId
      );
      setRows(mapped);
      setClientGroups([]);
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
    showAllClients,
    workspaceClients,
    workspaceTenantId,
    selectedWorkspaceClientId,
    loadPlayersForTenant,
  ]);

  useEffect(() => {
    if (authLoading) return;
    void loadPlayers();
  }, [authLoading, loadPlayers]);

  const handleWorkspaceChange = (clientId: string) => {
    if (clientId === ALL_CLIENTS_WORKSPACE_ID) {
      setSelectedWorkspaceClientId(ALL_CLIENTS_WORKSPACE_ID);
      setWorkspaceTenantId(null);
      setSelected([]);
      return;
    }
    const match = workspaceClients.find((c) => c.id === clientId);
    if (!match) return;
    setSelectedWorkspaceClientId(clientId);
    setWorkspaceTenantId(match.tenantId);
    setSelected([]);
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
      if (showAllClients) {
        for (const id of ids) {
          const group = clientGroups.find((g) =>
            g.players.some((p) => p.id === id)
          );
          if (group) {
            apiClient.setWorkspaceTenant(group.tenantId);
            await apiClient.deletePlayer(id);
          }
        }
      } else {
        if (workspaceTenantId) {
          apiClient.setWorkspaceTenant(workspaceTenantId);
        }
        for (const id of ids) {
          await apiClient.deletePlayer(id);
        }
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

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
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

  const filteredGroups = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientGroups;
    return clientGroups
      .map((g) => ({
        ...g,
        players: g.players.filter((p) =>
          `${p.name} ${p.location} ${p.deviceId}`.toLowerCase().includes(t)
        ),
      }))
      .filter((g) => g.players.length > 0);
  }, [q, clientGroups]);

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
    {
      key: "deviceId",
      label: "Device ID",
      render: (r) => <span className="text-gray-600">{r.deviceId}</span>,
    },
    {
      key: "location",
      label: "Location",
      render: (r) => <span className="text-gray-600">{r.location}</span>,
    },
    {
      key: "client",
      label: "Client",
      render: (r) => <span className="text-gray-600">{r.client ?? "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge s={r.status} />,
    },
    {
      key: "ip",
      label: "IP Address",
      render: (r) => <span className="text-gray-600">{r.ip ?? "—"}</span>,
    },
    {
      key: "currentAudio",
      label: "Current Audio",
      render: (r) => (
        <span className="text-gray-600">{r.currentAudio ?? "—"}</span>
      ),
    },
    {
      key: "lastActive",
      label: "Last Active",
      render: (r) => (
        <span className="text-gray-600">{r.lastActive ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-24",
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400">
            <FileText size={16} />
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400">
            <Edit3 size={16} />
          </span>
        </div>
      ),
    },
  ];

  const workspaceBlocked =
    isSuperAdmin && !showAllClients && !workspaceTenantId;

  const defaultModalClientId =
    showAllClients || !selectedWorkspaceClientId
      ? workspaceClients[0]?.id ?? ""
      : selectedWorkspaceClientId;

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
            <option value={ALL_CLIENTS_WORKSPACE_ID}>All Clients</option>
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
          ) : showAllClients ? (
            <div className="space-y-3">
              {filteredGroups.length === 0 && !pageLoading ? (
                <p className="text-sm text-gray-500 py-12 text-center">
                  No players found across client workspaces.
                </p>
              ) : (
                filteredGroups.map((group) => {
                  const expanded = expandedClients[group.clientId] ?? true;
                  return (
                    <div
                      key={group.clientId}
                      className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleClientExpanded(group.clientId)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-white hover:from-violet-100/80 transition-colors text-left"
                      >
                        <div>
                          <span className="font-semibold text-gray-900">
                            {group.clientName}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {group.players.length}{" "}
                            {group.players.length === 1 ? "player" : "players"}
                          </span>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-gray-500 shrink-0 transition-transform duration-200 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expanded && (
                        <div className="border-t border-gray-100 px-2 py-2">
                          {group.players.length === 0 ? (
                            <p className="text-sm text-gray-500 px-2 py-4">
                              No players assigned to this client yet.
                            </p>
                          ) : (
                            <AdminTable
                              columns={columns}
                              rows={group.players}
                              selected={selected.filter((id) =>
                                group.players.some((p) => p.id === id)
                              )}
                              onSelect={(id, checked) =>
                                setSelected((s) =>
                                  checked
                                    ? [...s, id]
                                    : s.filter((x) => x !== id)
                                )
                              }
                              onSelectAll={(checked) => {
                                const ids = group.players.map((p) => p.id);
                                setSelected((s) =>
                                  checked
                                    ? [...new Set([...s, ...ids])]
                                    : s.filter((x) => !ids.includes(x))
                                );
                              }}
                              onRowClick={() => {}}
                              onDeleteSelected={(ids) =>
                                void handleDeletePlayers(ids)
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
        defaultClientId={defaultModalClientId}
      />
    </div>
  );
}
