import type { ScheduleEntry } from "@/types/api";
import type { ApiClient } from "@/lib/api-client";
import type { WorkspaceClientOption } from "@/lib/workspace-clients";
import { isAllClientsSelection } from "@/lib/workspace-clients";
import type { ScheduleEventCard } from "@/app/schedule/components/EventCard";
import { shortDayFromDate } from "@/lib/schedule-calendar";
import {
  FRENCH_DEMO_PLAYER_REGISTRY,
  frenchDemoEnterpriseWorkspaceClients,
  frenchDemoPlayerName,
  frenchDemoTenantSlug,
  mergeEnterpriseWorkspaceClients,
} from "@/lib/french-demo-seed";

function seedRoomsForTenant(tenantId: string): { id: string; name: string }[] {
  return Object.entries(FRENCH_DEMO_PLAYER_REGISTRY)
    .filter(([, meta]) => meta.tenantId === tenantId)
    .map(([id, meta]) => ({ id, name: meta.name }));
}

export type TenantScheduleSegment = {
  clientId: string;
  clientName: string;
  tenantId: string;
  rooms: { id: string; name: string }[];
  events: ScheduleEventCard[];
};

export function scheduleEntryToEventCard(entry: ScheduleEntry): ScheduleEventCard {
  const startDate = new Date(entry.startsAt);
  const endDate = new Date(entry.endsAt);
  const durationMinutes = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  );

  return {
    id: entry.id,
    audioId: entry.mediaId ?? undefined,
    playlistId: entry.playlistId ?? undefined,
    title: entry.title,
    duration: durationMinutes,
    trackCount: entry.trackCount ?? undefined,
    roomId: entry.playerId,
    day: shortDayFromDate(startDate),
    calendarDate: startDate.toISOString().slice(0, 10),
    time: startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    loopPlayback: entry.loopPlayback ?? entry.recurrence === "DAILY",
  };
}

export function resolveAllClientsEnterpriseRows(
  workspaceClients: WorkspaceClientOption[]
): WorkspaceClientOption[] {
  const fromApi = workspaceClients.filter((c) => !isAllClientsSelection(c.id));
  const merged = mergeEnterpriseWorkspaceClients(fromApi);
  return merged.length > 0 ? merged : frenchDemoEnterpriseWorkspaceClients();
}

export async function loadAllClientScheduleSegments(
  apiClient: ApiClient,
  workspaceClients: WorkspaceClientOption[]
): Promise<TenantScheduleSegment[]> {
  const tenants = resolveAllClientsEnterpriseRows(workspaceClients);
  const segments: TenantScheduleSegment[] = [];

  for (const client of tenants) {
    const slug = frenchDemoTenantSlug(client.tenantId);
    apiClient.setWorkspaceTenant(client.tenantId, slug);
    try {
      const [playersRes, schedulesRes] = await Promise.all([
        apiClient.listPlayers(),
        apiClient.listSchedules(),
      ]);
      const events = (schedulesRes.schedules ?? []).map((s) => {
        const evt = scheduleEntryToEventCard(s);
        return { ...evt, tenantId: client.tenantId, tenantLabel: client.name };
      });
      const apiRooms = playersRes.players.map((p) => ({
        id: p.id,
        name:
          p.roomName ||
          p.playerName ||
          frenchDemoPlayerName(p.id) ||
          "Unnamed",
      }));
      const rooms =
        apiRooms.length > 0
          ? apiRooms
          : seedRoomsForTenant(client.tenantId);
      segments.push({
        clientId: client.id,
        clientName: client.name,
        tenantId: client.tenantId,
        rooms,
        events,
      });
    } catch {
      segments.push({
        clientId: client.id,
        clientName: client.name,
        tenantId: client.tenantId,
        rooms: seedRoomsForTenant(client.tenantId),
        events: [],
      });
    }
  }

  apiClient.clearWorkspaceTenant();
  return segments;
}