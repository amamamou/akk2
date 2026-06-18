import { getApiClient } from "@/lib/api-client";
import {
  loadAllClientScheduleSegments,
  resolveAllClientsEnterpriseRows,
  scheduleEntryToEventCard,
  type TenantScheduleSegment,
} from "@/lib/schedule-all-clients";
import {
  frenchDemoPlayerName,
  frenchDemoTenantSlug,
  mergeEnterpriseWorkspaceClients,
} from "@/lib/french-demo-seed";
import {
  toActiveWorkspaceClients,
  workspaceSelectorOptions,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";
import type {
  ActivityLogEntry,
  ClientBillingSummary,
  ClientInfo,
  InvoiceInfo,
  MediaInfo,
  PlaybackLogEntry,
  PlayerInfo,
  ScheduleEntry,
  SystemHealthMetrics,
} from "@/types/api";

export type WorkspaceClientsBundle = {
  workspaceOptions: WorkspaceClientOption[];
  clients: ClientInfo[];
  billingByClientId: Record<string, ClientBillingSummary>;
};

export function getApi() {
  return getApiClient();
}

export async function fetchPlayers(tenantId?: string | null): Promise<PlayerInfo[]> {
  const api = getApi();
  if (tenantId) {
    api.setWorkspaceTenant(tenantId, frenchDemoTenantSlug(tenantId));
  }
  const res = await api.listPlayers().catch(() => ({ ok: false, players: [] }));
  return res.players ?? [];
}

export async function fetchMedia(tenantId?: string | null): Promise<MediaInfo[]> {
  const api = getApi();
  if (tenantId) {
    api.setWorkspaceTenant(tenantId, frenchDemoTenantSlug(tenantId));
  }
  const res = await api.listMedia().catch(() => ({ ok: false, media: [] }));
  return res.media ?? [];
}

export async function fetchSchedules(tenantId?: string | null): Promise<ScheduleEntry[]> {
  const api = getApi();
  if (tenantId) {
    api.setWorkspaceTenant(tenantId, frenchDemoTenantSlug(tenantId));
  }
  const res = await api.listSchedules().catch(() => ({ ok: false, schedules: [] }));
  return res.schedules ?? [];
}

function normalizeInvoiceRow(raw: Record<string, unknown>): InvoiceInfo {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    invoiceNumber: String(raw.invoiceNumber ?? raw.invoice_number ?? ""),
    amount: Number(raw.amount ?? 0),
    status:
      String(raw.status ?? "UNPAID").toUpperCase() === "PAID" ? "PAID" : "UNPAID",
    dueDate: (raw.dueDate ?? raw.due_date) as string | null | undefined,
    downloadUrl: (raw.downloadUrl ?? raw.download_url) as string | null | undefined,
    createdAt: (raw.createdAt ?? raw.created_at) as string | null | undefined,
  };
}

function mergeBillingWithClients(
  clients: ClientInfo[],
  billingByClientId: Record<string, ClientBillingSummary>
): Record<string, ClientBillingSummary> {
  const merged = { ...billingByClientId };
  for (const client of clients) {
    if (merged[client.id]) continue;
    merged[client.id] = {
      clientId: client.id,
      tenantId: client.tenantId ?? null,
      subscriptionTier: client.subscriptionTier,
      planName: client.subscriptionTier,
      maxPlayers: client.maxPlayers,
      maxStorageGb: client.maxStorageGb,
      totalInvoiced: 0,
      outstandingBalance: 0,
      paidTotal: 0,
      invoiceCount: 0,
      recentInvoices: [],
    };
  }
  return merged;
}

export async function fetchWorkspaceClientsBundle(): Promise<WorkspaceClientsBundle> {
  const api = getApi();
  const [clientsRes, billingRes] = await Promise.all([
    api.listClients().catch(() => ({ ok: false, clients: [] })),
    api.getClientsBillingOverview().catch(() => null),
  ]);

  const rawClients = clientsRes?.clients ?? [];
  const clients = rawClients.map((c: Record<string, unknown>) =>
    normalizeClientRow(c)
  );

  const eligible = toActiveWorkspaceClients(rawClients);
  const mergedWorkspace = mergeEnterpriseWorkspaceClients(eligible);
  const workspaceOptions = workspaceSelectorOptions(mergedWorkspace);

  const billingByClientId: Record<string, ClientBillingSummary> = {};
  for (const summary of billingRes?.summaries ?? []) {
    const normalized = normalizeBillingRow(
      summary as unknown as Record<string, unknown>
    );
    if (normalized.clientId) {
      billingByClientId[normalized.clientId] = normalized;
    }
  }

  return {
    workspaceOptions,
    clients,
    billingByClientId: mergeBillingWithClients(clients, billingByClientId),
  };
}

/** @deprecated Use `fetchWorkspaceClientsBundle` with TanStack Query `select`. */
export async function fetchWorkspaceClients(): Promise<WorkspaceClientOption[]> {
  const bundle = await fetchWorkspaceClientsBundle();
  return bundle.workspaceOptions;
}

/** @deprecated Use `fetchWorkspaceClientsBundle` with TanStack Query `select`. */
export async function fetchClientsWithBilling(): Promise<{
  clients: ClientInfo[];
  billingByClientId: Record<string, ClientBillingSummary>;
}> {
  const bundle = await fetchWorkspaceClientsBundle();
  return {
    clients: bundle.clients,
    billingByClientId: bundle.billingByClientId,
  };
}

function normalizeClientRow(client: Record<string, unknown>): ClientInfo {
  return {
    id: String(client.id),
    tenantId: (client.tenantId ?? client.tenant_id) as string | undefined,
    name: String(client.name ?? "Untitled client"),
    businessType: String(client.businessType ?? client.business_type ?? ""),
    contactPerson: String(client.contactPerson ?? client.contact_person ?? ""),
    email: String(client.email ?? ""),
    phone: String(client.phone ?? ""),
    status: (client.status ?? "INACTIVE") as ClientInfo["status"],
    subscriptionTier: (client.subscriptionTier ??
      client.subscription_tier ??
      "STARTER") as ClientInfo["subscriptionTier"],
    maxPlayers: Number(client.maxPlayers ?? client.max_players ?? 0),
    maxStorageGb: Number(client.maxStorageGb ?? client.max_storage_gb ?? 0),
    createdAt: (client.createdAt ?? client.created_at) as string | undefined,
  };
}

function normalizeBillingRow(raw: Record<string, unknown>): ClientBillingSummary {
  return {
    clientId: String(raw.clientId ?? raw.client_id ?? ""),
    tenantId: (raw.tenantId ?? raw.tenant_id) as string | null | undefined,
    subscriptionTier: String(raw.subscriptionTier ?? raw.subscription_tier ?? "STARTER"),
    planName: (raw.planName ?? raw.plan_name) as string | null | undefined,
    maxPlayers: Number(raw.maxPlayers ?? raw.max_players ?? 0),
    maxStorageGb: Number(raw.maxStorageGb ?? raw.max_storage_gb ?? 0),
    totalInvoiced: Number(raw.totalInvoiced ?? raw.total_invoiced ?? 0),
    outstandingBalance: Number(raw.outstandingBalance ?? raw.outstanding_balance ?? 0),
    paidTotal: Number(raw.paidTotal ?? raw.paid_total ?? 0),
    invoiceCount: Number(raw.invoiceCount ?? raw.invoice_count ?? 0),
    recentInvoices:
      ((raw.recentInvoices ?? raw.recent_invoices) as unknown[] | undefined)?.map(
        (inv) => normalizeInvoiceRow(inv as Record<string, unknown>)
      ) ?? [],
  };
}

export async function fetchSystemHealth(
  scope?: "all"
): Promise<SystemHealthMetrics | null> {
  const api = getApi();
  return api.getSystemHealth(scope).catch(() => null);
}

export async function fetchPlaybackLogs(
  limit = 200,
  scope?: "all"
): Promise<PlaybackLogEntry[]> {
  const api = getApi();
  const res = await api.getPlaybackLogs(limit, scope);
  return res.logs ?? [];
}

export async function fetchDashboardActivity(): Promise<ActivityLogEntry[]> {
  const api = getApi();
  const activityRes = await api
    .getDashboardActivity(1, 10)
    .catch(() => api.listActivityLogs(10))
    .catch(() => ({ ok: false, activities: [], activityLogs: [] }));
  return activityRes?.activities ?? activityRes?.activityLogs ?? [];
}

export type ScheduleWorkspaceData = {
  rooms: { id: string; name: string }[];
  audio: {
    id: string;
    title: string;
    duration: number;
    type: string;
    url?: string;
  }[];
  events: ReturnType<typeof scheduleEntryToEventCard>[];
};

export async function fetchScheduleWorkspace(
  tenantId: string
): Promise<ScheduleWorkspaceData> {
  const api = getApi();
  api.setWorkspaceTenant(tenantId, frenchDemoTenantSlug(tenantId));

  const [playersRes, mediaRes, schedulesRes] = await Promise.all([
    api.listPlayers(),
    api.listMedia(),
    api.listSchedules(),
  ]);

  return {
    rooms: playersRes.players.map((p) => ({
      id: p.id,
      name:
        p.roomName ||
        p.playerName ||
        frenchDemoPlayerName(p.id) ||
        "Unnamed",
    })),
    audio: mediaRes.media.map((m) => ({
      id: m.id,
      title: m.title,
      duration:
        m.durationMinutes && m.durationMinutes > 0 ? m.durationMinutes : 60,
      type: m.category || "Audio",
      url: m.url,
    })),
    events: (schedulesRes.schedules ?? []).map((s) => scheduleEntryToEventCard(s)),
  };
}

export async function fetchScheduleAllClients(
  workspaceClients: WorkspaceClientOption[]
): Promise<TenantScheduleSegment[]> {
  const api = getApi();
  const enterpriseRows = resolveAllClientsEnterpriseRows(workspaceClients);
  return loadAllClientScheduleSegments(api, enterpriseRows);
}
