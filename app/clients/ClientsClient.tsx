"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import { fetchWorkspaceClientsBundle } from "@/lib/query-fetchers";
import { queryKeys } from "@/lib/query-keys";
import type { ClientBillingSummary, ClientCreateInput, ClientInfo } from "@/types/api";
import IssueInvoiceModal from "./components/IssueInvoiceModal";
import CreateClientModal from "./components/CreateClientModal";
import EditClientModal, { type ClientUpdatePayload } from "./components/EditClientModal";
import DeleteClientModal from "./components/DeleteClientModal";
import AdminToast from "@/app/admin/components/AdminToast";
import ClientsHero from "./components/ClientsHero";
import ClientsToolbar, {
  ClientsResultsSummary,
  ClientsSearch,
  type ClientPlanFilter,
  type ClientSortKey,
  type ClientStatusFilter,
} from "./components/ClientsToolbar";
import ClientCard from "./components/ClientCard";
import ClientsEmptyState from "./components/ClientsEmptyState";
import ClientsPageSkeleton from "./components/ClientsPageSkeleton";
import {
  dashboardCardClass,
  dashboardContainerClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

function sortClients(
  items: ClientInfo[],
  sort: ClientSortKey,
  billingByClientId: Record<string, ClientBillingSummary>
): ClientInfo[] {
  const sorted = [...items];

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "outstanding-desc":
      sorted.sort(
        (a, b) =>
          (billingByClientId[b.id]?.outstandingBalance ?? 0) -
          (billingByClientId[a.id]?.outstandingBalance ?? 0)
      );
      break;
    case "created-desc":
      sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      break;
  }

  return sorted;
}

export default function ClientsClient() {
  const apiClient = getApiClient();
  const { user, isLoading: authLoading } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<ClientPlanFilter>("all");
  const [sort, setSort] = useState<ClientSortKey>("name-asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("Client created successfully");
  const [invoiceClient, setInvoiceClient] = useState<ClientInfo | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientInfo | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteClient, setDeleteClient] = useState<ClientInfo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: queryKeys.workspaceClients(),
    queryFn: fetchWorkspaceClientsBundle,
    enabled: isSuperAdmin && !authLoading,
  });

  const createClientMutation = useMutation({
    mutationFn: (payload: ClientCreateInput) => apiClient.createClient(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceClients() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsBilling() });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: ClientUpdatePayload }) =>
      apiClient.updateClient(clientId, {
        name: payload.name,
        business_type: payload.businessType,
        contact_person: payload.contactPerson,
        email: payload.email,
        phone: payload.phone,
        subscription_tier: payload.subscriptionTier,
        max_players: payload.maxPlayers,
        max_storage_gb: payload.maxStorageGb,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceClients() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsBilling() });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => apiClient.deleteClient(clientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceClients() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.clientsBilling() });
    },
  });

  const clients = useMemo(() => clientsQuery.data?.clients ?? [], [clientsQuery.data]);

  const billingByClientIdResolved = useMemo(
    () => clientsQuery.data?.billingByClientId ?? {},
    [clientsQuery.data]
  );

  const loading = authLoading || (isSuperAdmin && clientsQuery.isPending && !clientsQuery.data);
  const refreshing = isSuperAdmin && clientsQuery.isFetching && !clientsQuery.isPending;

  const queryError = clientsQuery.error as
    | { response?: { status?: number; data?: { error?: string } }; message?: string }
    | undefined;
  const loadError = queryError
    ? queryError.response?.status === 403
      ? "You do not have permission to view this page."
      : queryError.response?.data?.error ||
        queryError.message ||
        "Failed to load clients"
    : null;

  const hasActiveFilters =
    statusFilter !== "all" || planFilter !== "all" || query.trim().length > 0;

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let result = clients;

    if (statusFilter !== "all") {
      result = result.filter((client) => client.status === statusFilter);
    }

    if (planFilter !== "all") {
      result = result.filter((client) => client.subscriptionTier === planFilter);
    }

    if (normalizedQuery) {
      result = result.filter((client) => {
        const haystack = [
          client.name,
          client.businessType,
          client.contactPerson,
          client.email,
          client.phone,
          client.subscriptionTier,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    return sortClients(result, sort, billingByClientIdResolved);
  }, [clients, query, statusFilter, planFilter, sort, billingByClientIdResolved]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setPlanFilter("all");
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.workspaceClients() });
  };

  const handleCreateClient = async (payload: ClientCreateInput) => {
    setCreateLoading(true);
    try {
      await createClientMutation.mutateAsync(payload);
      setToastMessage(`Created client: ${payload.name}`);
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 2500);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateClient = async (clientId: string, payload: ClientUpdatePayload) => {
    setEditLoading(true);
    try {
      await updateClientMutation.mutateAsync({ clientId, payload });
      setToastMessage(`Updated client: ${payload.name}`);
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 2500);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setDeleteLoading(true);
    try {
      const name = deleteClient?.name ?? "Client";
      await deleteClientMutation.mutateAsync(clientId);
      setDeleteOpen(false);
      setDeleteClient(null);
      setToastMessage(`Deleted client: ${name}`);
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 2500);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      setToastMessage(
        ax?.response?.data?.error ||
          (err instanceof Error ? err.message : "Failed to delete client")
      );
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 3500);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <ClientsPageSkeleton />;
  }

  if (!isSuperAdmin) {
    return (
      <div className={dashboardPageClass}>
        <div className={dashboardContainerClass}>
          <div className={cn(dashboardCardClass, "max-w-2xl p-8")}>
            <div className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <h1 className="text-xl font-semibold">Clients</h1>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400">
              This area is available to{" "}
              <span className="font-semibold">SUPER_ADMIN</span> users only.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-500">
              Your current role is{" "}
              <span className="font-medium">{role || "UNKNOWN"}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = clients.length;
  const showToolbar = totalCount > 0;
  const emptyVariant =
    totalCount === 0 ? ("no-clients" as const) : ("no-results" as const);

  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        <ClientsHero
          onCreateClick={() => setCreateOpen(true)}
          searchSlot={<ClientsSearch query={query} setQuery={setQuery} />}
          summarySlot={
            totalCount > 0 ? (
              <ClientsResultsSummary
                filteredCount={filteredClients.length}
                totalCount={totalCount}
                hasActiveFilters={hasActiveFilters}
              />
            ) : null
          }
        />

        {loadError ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{loadError}</p>
          </div>
        ) : null}

        {showToolbar ? (
          <ClientsToolbar
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            sort={sort}
            setSort={setSort}
            onClearFilters={clearFilters}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        ) : null}

        {filteredClients.length === 0 ? (
          <ClientsEmptyState
            variant={emptyVariant}
            onCreateClick={() => setCreateOpen(true)}
            onClearFilters={clearFilters}
          />
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-5 lg:grid-cols-2",
              refreshing && "pointer-events-none opacity-60"
            )}
          >
            {filteredClients.map((client) => {
              const billing = billingByClientIdResolved[client.id];
              return (
                <ClientCard
                  key={client.id}
                  client={client}
                  billing={billing}
                  onEdit={() => {
                    setEditClient(client);
                    setEditOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteClient(client);
                    setDeleteOpen(true);
                  }}
                  onIssueInvoice={() => {
                    setInvoiceClient({
                      ...client,
                      tenantId: client.tenantId ?? billing?.tenantId ?? undefined,
                    });
                    setInvoiceModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <CreateClientModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateClient}
        isSubmitting={createLoading}
      />

      <EditClientModal
        open={editOpen}
        client={editClient}
        onClose={() => {
          setEditOpen(false);
          setEditClient(null);
        }}
        onSubmit={handleUpdateClient}
        isSubmitting={editLoading}
      />

      <DeleteClientModal
        open={deleteOpen}
        client={deleteClient}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setDeleteClient(null);
          }
        }}
        onConfirm={handleDeleteClient}
        isDeleting={deleteLoading}
      />

      <IssueInvoiceModal
        open={invoiceModalOpen}
        client={invoiceClient}
        onClose={() => {
          setInvoiceModalOpen(false);
          setInvoiceClient(null);
        }}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.workspaceClients() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.clientsBilling() });
          setToastMessage("Invoice registered successfully");
          setToastOpen(true);
        }}
      />

      <AdminToast open={toastOpen} message={toastMessage} />
    </div>
  );
}
