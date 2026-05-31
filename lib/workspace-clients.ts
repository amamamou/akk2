import type { ClientInfo } from "@/types/api";
import {
  ALL_CLIENTS_WORKSPACE_ID,
  ALL_TENANTS_SENTINEL,
} from "@/lib/demo-workspaces";

export { ALL_CLIENTS_WORKSPACE_ID, ALL_TENANTS_SENTINEL };

export type WorkspaceClientOption = {
  id: string;
  name: string;
  tenantId: string;
};

/** Prepended to super-admin workspace dropdowns (Players, etc.). */
export const ALL_CLIENTS_OPTION: WorkspaceClientOption = {
  id: ALL_CLIENTS_WORKSPACE_ID,
  name: "All Clients",
  tenantId: ALL_TENANTS_SENTINEL,
};

export function isAllClientsSelection(clientId: string): boolean {
  return clientId === ALL_CLIENTS_WORKSPACE_ID;
}

export function normalizeClientRecord(raw: Record<string, unknown>): ClientInfo {
  return {
    id: String(raw.id ?? ""),
    tenantId: (raw.tenantId ?? raw.tenant_id) as string | undefined,
    name: String(raw.name ?? "Untitled client"),
    businessType: String(raw.businessType ?? raw.business_type ?? ""),
    contactPerson: String(raw.contactPerson ?? raw.contact_person ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    status: String(raw.status ?? "INACTIVE").toUpperCase() as ClientInfo["status"],
    subscriptionTier: (raw.subscriptionTier ??
      raw.subscription_tier ??
      "STARTER") as ClientInfo["subscriptionTier"],
    maxPlayers: Number(raw.maxPlayers ?? raw.max_players ?? 0),
    maxStorageGb: Number(raw.maxStorageGb ?? raw.max_storage_gb ?? 0),
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
  };
}

export function toActiveWorkspaceClients(
  clients: Record<string, unknown>[]
): WorkspaceClientOption[] {
  const active = clients
    .map(normalizeClientRecord)
    .filter(
      (c) =>
        c.status === "ACTIVE" && Boolean(c.tenantId && String(c.tenantId).trim())
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      tenantId: String(c.tenantId),
    }));

  return active;
}

export function workspaceSelectorOptions(
  clients: WorkspaceClientOption[]
): WorkspaceClientOption[] {
  return [ALL_CLIENTS_OPTION, ...clients];
}
