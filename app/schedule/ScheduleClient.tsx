"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AlertCircle, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  buildWeekDays,
  buildMonthGrid,
  buildDateForDayAndTime,
  buildDateForIsoAndTime,
  shortDayFromDate,
  HOUR_SLOTS,
  eventMatchesHour,
  dayColumnFromAnchor,
  type ScheduleViewMode,
  type DayColumn,
} from "@/lib/schedule-calendar";
import ScheduleToolbar from "./components/ScheduleToolbar";
import CalendarCell from "./components/CalendarCell";
import ScheduleAssignModal, { type PlaylistPick } from "./components/ScheduleAssignModal";
import EventCard, { type ScheduleEventCard } from "./components/EventCard";
import InspectorPanel from "./components/InspectorPanel";
import DayTimelineGrid from "./components/DayTimelineGrid";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import {
  fetchScheduleAllClients,
  fetchScheduleWorkspace,
  fetchWorkspaceClientsBundle,
} from "@/lib/query-fetchers";
import { queryKeys } from "@/lib/query-keys";
import {
  scheduleEntryToEventCard,
  resolveAllClientsEnterpriseRows,
  type TenantScheduleSegment,
} from "@/lib/schedule-all-clients";
import {
  FRENCH_DEMO_PLAYER_REGISTRY,
  frenchDemoPlayerName,
  frenchDemoTenantForPlayer,
  frenchDemoTenantSlug,
} from "@/lib/french-demo-seed";
import { isAllClientsSelection } from "@/lib/workspace-clients";
import { ALL_CLIENTS_WORKSPACE_ID } from "@/lib/demo-workspaces";

type AudioItem = {
  id: string;
  title: string;
  duration: number;
  type: string;
  url?: string;
};

function playlistDurationMinutes(trackCount: number) {
  return Math.max(15, trackCount * 4);
}

/** Keep room filter in sync with catalog + optional ?roomId= deep link. */
function pickSelectedRoom(
  catalog: { id: string; name: string }[],
  opts: { roomIdParam: string | null; current: string }
): string {
  if (catalog.length === 0) return "all";

  if (opts.roomIdParam && catalog.some((r) => r.id === opts.roomIdParam)) {
    return opts.roomIdParam;
  }

  if (opts.current !== "all" && catalog.some((r) => r.id === opts.current)) {
    return opts.current;
  }

  return "all";
}

export default function ScheduleClientPage() {
  const apiClient = getApiClient();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");
  const { user, isLoading: authLoading } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [events, setEvents] = useState<ScheduleEventCard[]>([]);
  const [audio, setAudio] = useState<AudioItem[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [workspaceClients, setWorkspaceClients] = useState<
    { id: string; name: string; tenantId: string }[]
  >([]);
  const [selectedWorkspaceClientId, setSelectedWorkspaceClientId] =
    useState<string>(ALL_CLIENTS_WORKSPACE_ID);
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(
    null
  );
  const [pendingDeleteEvent, setPendingDeleteEvent] =
    useState<ScheduleEventCard | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [tenantSegments, setTenantSegments] = useState<TenantScheduleSegment[]>([]);
  const [pickerCell, setPickerCell] = useState<{
    roomId: string;
    day: string;
    time: string;
    calendarDate?: string;
    tenantId?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("week");
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [inspectorEvent, setInspectorEvent] = useState<ScheduleEventCard | null>(null);
  const [inspectorSaving, setInspectorSaving] = useState(false);

  const weekDays = useMemo(() => buildWeekDays(calendarAnchor), [calendarAnchor]);
  const monthWeeks = useMemo(() => buildMonthGrid(calendarAnchor), [calendarAnchor]);
  const dayColumn = useMemo(() => dayColumnFromAnchor(calendarAnchor), [calendarAnchor]);

  const calendarPeriodLabel = useMemo(() => {
    if (viewMode === "month") {
      return calendarAnchor.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
    if (viewMode === "day") {
      return calendarAnchor.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    const days = buildWeekDays(calendarAnchor);
    if (days.length > 0) {
      return `${days[0].date} – ${days[days.length - 1].date}`;
    }
    return calendarAnchor.toLocaleDateString();
  }, [calendarAnchor, viewMode]);

  const shiftCalendarPeriod = useCallback(
    (direction: -1 | 1) => {
      setCalendarAnchor((prev) => {
        const next = new Date(prev);
        if (viewMode === "month") {
          next.setMonth(next.getMonth() + direction);
        } else if (viewMode === "day") {
          next.setDate(next.getDate() + direction);
        } else {
          next.setDate(next.getDate() + direction * 7);
        }
        return next;
      });
    },
    [viewMode]
  );

  const resetCalendarToToday = useCallback(() => {
    setCalendarAnchor(new Date());
  }, []);

  const isAllClientsWorkspace =
    isSuperAdmin && isAllClientsSelection(selectedWorkspaceClientId);
  const allClientRooms = useMemo(() => {
    if (!isAllClientsWorkspace) return rooms;
    const merged: { id: string; name: string }[] = [];
    for (const seg of tenantSegments) {
      for (const r of seg.rooms) {
        merged.push({
          id: r.id,
          name: `${seg.clientName} — ${r.name}`,
        });
      }
    }
    return merged;
  }, [isAllClientsWorkspace, rooms, tenantSegments]);

  // Sync room filter when catalog or deep link changes (always default to "all").
  useEffect(() => {
    const catalog = isAllClientsWorkspace ? allClientRooms : rooms;
    setSelectedRoom((current) =>
      pickSelectedRoom(catalog, { roomIdParam, current })
    );
  }, [roomIdParam, rooms, allClientRooms, isAllClientsWorkspace]);

  const activeWorkspaceClient = useMemo(
    () => workspaceClients.find((c) => c.id === selectedWorkspaceClientId),
    [workspaceClients, selectedWorkspaceClientId]
  );

  const assignModalTenantId = useMemo(() => {
    if (pickerCell?.tenantId) return pickerCell.tenantId;
    if (isSuperAdmin) return workspaceTenantId;
    return user?.tenantId || apiClient.getEffectiveTenantId() || null;
  }, [pickerCell?.tenantId, isSuperAdmin, workspaceTenantId, user?.tenantId, apiClient]);

  const workspaceClientsQuery = useQuery({
    queryKey: queryKeys.workspaceClients(),
    queryFn: fetchWorkspaceClientsBundle,
    enabled: isSuperAdmin && !authLoading,
    select: (data) => data.workspaceOptions,
  });

  useEffect(() => {
    if (!workspaceClientsQuery.data?.length) return;
    setWorkspaceClients(workspaceClientsQuery.data);
    setSelectedWorkspaceClientId((prev) => {
      if (prev && workspaceClientsQuery.data.some((o) => o.id === prev)) return prev;
      const allClients = workspaceClientsQuery.data.find((c) =>
        isAllClientsSelection(c.id)
      );
      return allClients?.id ?? ALL_CLIENTS_WORKSPACE_ID;
    });
  }, [workspaceClientsQuery.data]);

  useEffect(() => {
    if (workspaceClientsQuery.error) {
      const ax = workspaceClientsQuery.error as {
        response?: { data?: { error?: string } };
      };
      setError(ax?.response?.data?.error || "Failed to load client workspaces");
      setWorkspaceClients([]);
    }
  }, [workspaceClientsQuery.error]);

  const scheduleWorkspaceKey = workspaceTenantId ?? user?.tenantId ?? "session";

  const scheduleWorkspaceQuery = useQuery({
    queryKey: queryKeys.schedule(scheduleWorkspaceKey),
    queryFn: async () => {
      const tenantId =
        workspaceTenantId ?? user?.tenantId ?? apiClient.getEffectiveTenantId();
      if (!tenantId) throw new Error("No tenant context for schedule");
      return fetchScheduleWorkspace(tenantId);
    },
    enabled:
      !authLoading &&
      !isAllClientsWorkspace &&
      (!isSuperAdmin || Boolean(workspaceTenantId)),
  });

  const allClientsScheduleQuery = useQuery({
    queryKey: queryKeys.scheduleAllClients(selectedWorkspaceClientId),
    queryFn: () => fetchScheduleAllClients(workspaceClients),
    enabled:
      !authLoading && isAllClientsWorkspace && workspaceClients.length > 0,
  });

  useEffect(() => {
    if (isAllClientsWorkspace) {
      if (allClientsScheduleQuery.data) {
        setTenantSegments(allClientsScheduleQuery.data);
        setRooms([]);
        setAudio([]);
        setEvents([]);
      }
      setIsLoading(allClientsScheduleQuery.isPending);
      if (allClientsScheduleQuery.error) {
        const ax = allClientsScheduleQuery.error as {
          response?: { data?: { error?: string } };
        };
        setError(ax?.response?.data?.error || "Failed to load schedules for all clients");
      }
      return;
    }

    if (isSuperAdmin && !workspaceTenantId) {
      setIsLoading(false);
      setTenantSegments([]);
      setRooms([]);
      setAudio([]);
      setEvents([]);
      return;
    }

    if (scheduleWorkspaceQuery.data) {
      setTenantSegments([]);
      setRooms(scheduleWorkspaceQuery.data.rooms);
      setAudio(scheduleWorkspaceQuery.data.audio);
      setEvents(scheduleWorkspaceQuery.data.events);
    }
    setIsLoading(scheduleWorkspaceQuery.isPending);
    if (scheduleWorkspaceQuery.error) {
      const ax = scheduleWorkspaceQuery.error as {
        response?: { data?: { error?: string } };
      };
      setError(ax?.response?.data?.error || "Failed to load schedule");
    }
  }, [
    isAllClientsWorkspace,
    isSuperAdmin,
    workspaceTenantId,
    allClientsScheduleQuery.data,
    allClientsScheduleQuery.isPending,
    allClientsScheduleQuery.error,
    scheduleWorkspaceQuery.data,
    scheduleWorkspaceQuery.isPending,
    scheduleWorkspaceQuery.error,
  ]);

  const invalidateScheduleQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["schedule"] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.schedules() });
  }, [queryClient]);

  const createScheduleMutation = useMutation({
    mutationFn: (payload: Parameters<typeof apiClient.createSchedule>[0]) =>
      apiClient.createSchedule(payload),
    onSuccess: () => invalidateScheduleQueries(),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof apiClient.updateSchedule>[1];
    }) => apiClient.updateSchedule(id, data),
    onSuccess: () => invalidateScheduleQueries(),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteSchedule(id),
    onSuccess: () => invalidateScheduleQueries(),
  });

  const handleWorkspaceClientChange = (clientId: string) => {
    const match = workspaceClients.find((c) => c.id === clientId);
    if (!match) return;
    setSelectedWorkspaceClientId(clientId);
    setSelectedRoom("all");
    setSelectedDay("all");
    setError(null);
    if (clientId === ALL_CLIENTS_WORKSPACE_ID || isAllClientsSelection(clientId)) {
      apiClient.clearWorkspaceTenant();
      setWorkspaceTenantId(null);
      setRooms([]);
      setAudio([]);
      setEvents([]);
      setTenantSegments([]);
      return;
    }
    setTenantSegments([]);
    setWorkspaceTenantId(match.tenantId);
  };

  const activeRooms = isAllClientsWorkspace ? allClientRooms : rooms;

  const inspectorRooms = useMemo(() => {
    if (!inspectorEvent) return activeRooms;
    if (inspectorEvent.tenantId && isAllClientsWorkspace) {
      const seg = tenantSegments.find((s) => s.tenantId === inspectorEvent.tenantId);
      if (seg?.rooms.length) return seg.rooms;
    }
    return activeRooms;
  }, [inspectorEvent, isAllClientsWorkspace, tenantSegments, activeRooms]);

  const roomsToShow = useMemo(
    () =>
      selectedRoom === "all"
        ? activeRooms
        : activeRooms.filter((r) => r.id === selectedRoom),
    [activeRooms, selectedRoom]
  );

  const renderScheduleBody = () => {
    if (isAllClientsWorkspace) {
      const fallbackSegments: TenantScheduleSegment[] =
        resolveAllClientsEnterpriseRows(workspaceClients).map((client) => ({
          clientId: client.id,
          clientName: client.name,
          tenantId: client.tenantId,
          rooms: Object.entries(FRENCH_DEMO_PLAYER_REGISTRY)
            .filter(([, m]) => m.tenantId === client.tenantId)
            .map(([id, m]) => ({ id, name: m.name })),
          events: [],
        }));
      const segmentsToRender =
        tenantSegments.length > 0 ? tenantSegments : fallbackSegments;

      if (segmentsToRender.length === 0) {
        return (
          <div className="flex items-center justify-center h-full min-h-[240px] text-sm text-gray-500 dark:text-zinc-400">
            No client workspaces available.
          </div>
        );
      }

      return (
        <div className="min-w-0 divide-y divide-gray-200">
          {segmentsToRender.map((seg) => {
            const segRooms =
              selectedRoom === "all"
                ? seg.rooms
                : seg.rooms.filter((r) => r.id === selectedRoom);
            if (segRooms.length === 0) return null;
            return (
              <section key={seg.tenantId} className="py-2">
                <h3 className="px-4 py-2 text-sm font-semibold text-violet-900 bg-violet-50/60 border-b border-violet-100">
                  {seg.clientName}
                </h3>
                <div className="min-w-0">
                  {viewMode === "month"
                    ? renderMonthGrid(seg.events, segRooms, seg.tenantId)
                    : viewMode === "hour"
                      ? renderHourGrid(seg.events, segRooms, seg.tenantId)
                      : viewMode === "day"
                        ? renderDayGrid(seg.events, segRooms, seg.tenantId)
                        : renderWeekGrid(seg.events, segRooms, seg.tenantId)}
                </div>
              </section>
            );
          })}
        </div>
      );
    }

    if (rooms.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[240px]">
          <div className="text-center">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">No players yet</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Create a player in the Players page to get started
            </p>
          </div>
        </div>
      );
    }

    if (roomsToShow.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[240px] text-sm text-gray-500 dark:text-zinc-400">
          No room matches the selected filter.
        </div>
      );
    }

    return (
      <div className="min-w-0">
        {viewMode === "month"
          ? renderMonthGrid(events, roomsToShow, workspaceTenantId ?? undefined)
          : viewMode === "hour"
            ? renderHourGrid(events, roomsToShow, workspaceTenantId ?? undefined)
            : viewMode === "day"
              ? renderDayGrid(events, roomsToShow, workspaceTenantId ?? undefined)
              : renderWeekGrid(events, roomsToShow, workspaceTenantId ?? undefined)}
      </div>
    );
  };

  const daysToShow = useMemo(
    () =>
      selectedDay === "all"
        ? weekDays
        : weekDays.filter((d) => d.short === selectedDay),
    [selectedDay]
  );

  const appendEventFromResponse = useCallback(
    (
      schedule: Parameters<typeof scheduleEntryToEventCard>[0],
      roomId: string,
      day: string,
      time: string,
      calendarDate?: string,
      loopPlayback?: boolean,
      tenantId?: string
    ) => {
      const mapped = scheduleEntryToEventCard(schedule);
      const next: ScheduleEventCard = {
        ...mapped,
        roomId,
        day,
        time,
        calendarDate: calendarDate ?? mapped.calendarDate,
        loopPlayback: loopPlayback ?? mapped.loopPlayback,
        tenantId,
      };
      if (isAllClientsWorkspace && tenantId) {
        setTenantSegments((prev) =>
          prev.map((seg) =>
            seg.tenantId === tenantId
              ? { ...seg, events: [...seg.events, next] }
              : seg
          )
        );
      } else {
        setEvents((prev) => [...prev, next]);
      }
    },
    [isAllClientsWorkspace]
  );

  const handleScheduleError = (err: unknown) => {
    const ax = err as {
      response?: { status?: number; data?: { error?: string; code?: string } };
      message?: string;
    };
    const status = ax?.response?.status;
    const body = ax?.response?.data;
    if (status === 409 || body?.code === "TIME_CONFLICT") {
      setError("This time slot is already taken!");
    } else {
      setError(
        body?.error || body?.code || ax?.message || "Failed to create schedule"
      );
    }
  };

  const resolveStartDate = (
    day: string,
    time: string,
    calendarDate?: string
  ) => {
    if (calendarDate) return buildDateForIsoAndTime(calendarDate, time);
    return buildDateForDayAndTime(day, time, calendarAnchor);
  };

  const resolvePickerTenantId = useCallback(
    (roomId: string, segmentTenantId?: string) =>
      segmentTenantId ??
      workspaceTenantId ??
      frenchDemoTenantForPlayer(roomId) ??
      user?.tenantId ??
      apiClient.getEffectiveTenantId() ??
      null,
    [workspaceTenantId, user?.tenantId, apiClient]
  );

  const withScheduleTenant = async (tenantId?: string | null) => {
    const tid =
      tenantId ||
      workspaceTenantId ||
      user?.tenantId ||
      apiClient.getEffectiveTenantId();
    if (tid) {
      apiClient.setWorkspaceTenant(tid, frenchDemoTenantSlug(tid));
    }
  };

  const createAudioSchedule = async (
    item: AudioItem,
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string,
    loopPlayback = false,
    tenantId?: string
  ) => {
    await withScheduleTenant(tenantId ?? pickerCell?.tenantId);
    const start = resolveStartDate(day, time, calendarDate);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + Math.max(1, item.duration));
    if (start >= end) {
      setError("Invalid time range - end time must be after start time");
      return;
    }
    const res = await createScheduleMutation.mutateAsync({
      playerId: roomId,
      mediaId: item.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      recurrence: loopPlayback ? "DAILY" : "ONCE",
      loopPlayback,
    });
    appendEventFromResponse(
      res.schedule,
      roomId,
      day,
      time,
      calendarDate ?? start.toISOString().slice(0, 10),
      loopPlayback,
      tenantId ?? pickerCell?.tenantId
    );
  };

  const createPlaylistSchedule = async (
    playlist: PlaylistPick,
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string,
    loopPlayback = false,
    tenantId?: string
  ) => {
    await withScheduleTenant(tenantId ?? pickerCell?.tenantId);
    const start = resolveStartDate(day, time, calendarDate);
    const end = new Date(start);
    const minutes = playlistDurationMinutes(playlist.trackCount);
    end.setMinutes(end.getMinutes() + minutes);
    if (start >= end) {
      setError("Invalid time range - end time must be after start time");
      return;
    }
    const res = await createScheduleMutation.mutateAsync({
      playerId: roomId,
      playlistId: playlist.playlistId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      recurrence: loopPlayback ? "DAILY" : "ONCE",
      loopPlayback,
    });
    appendEventFromResponse(
      res.schedule,
      roomId,
      day,
      time,
      calendarDate ?? start.toISOString().slice(0, 10),
      loopPlayback,
      tenantId ?? pickerCell?.tenantId
    );
  };

  const openAssignPicker = useCallback(
    (
      roomId: string,
      day: string,
      time: string,
      calendarDate?: string,
      tenantId?: string
    ) => {
      const scopedTenant = resolvePickerTenantId(roomId, tenantId);
      setPickerCell({
        roomId,
        day,
        time,
        calendarDate,
        tenantId: scopedTenant ?? undefined,
      });
      setAssignModalOpen(true);
    },
    [resolvePickerTenantId]
  );

  const handleDropEvent = async (
    item: AudioItem,
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string
  ) => {
    try {
      setError(null);
      await createAudioSchedule(item, roomId, day, time, calendarDate, false);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const handleDropPlaylist = async (
    item: PlaylistPick,
    roomId: string,
    day: string,
    time: string,
    calendarDate?: string
  ) => {
    try {
      setError(null);
      await createPlaylistSchedule(item, roomId, day, time, calendarDate, false);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const handleSelectAudio = async (item: AudioItem, loopPlayback: boolean) => {
    if (!pickerCell) return;
    try {
      setError(null);
      await createAudioSchedule(
        item,
        pickerCell.roomId,
        pickerCell.day,
        pickerCell.time,
        pickerCell.calendarDate,
        loopPlayback
      );
      setAssignModalOpen(false);
      setPickerCell(null);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const handleSelectPlaylist = async (playlist: PlaylistPick, loopPlayback: boolean) => {
    if (!pickerCell) return;
    try {
      setError(null);
      await createPlaylistSchedule(
        playlist,
        pickerCell.roomId,
        pickerCell.day,
        pickerCell.time,
        pickerCell.calendarDate,
        loopPlayback
      );
      setAssignModalOpen(false);
      setPickerCell(null);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!pendingDeleteEvent) return;
    const deleted = pendingDeleteEvent;
    try {
      await withScheduleTenant(deleted.tenantId);
      await deleteScheduleMutation.mutateAsync(deleted.id);

      if (isAllClientsWorkspace && deleted.tenantId) {
        setTenantSegments((prev) =>
          prev.map((seg) =>
            seg.tenantId === deleted.tenantId
              ? {
                  ...seg,
                  events: seg.events.filter((e) => e.id !== deleted.id),
                }
              : seg
          )
        );
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== deleted.id));
      }

      if (inspectorEvent?.id === deleted.id) {
        setInspectorEvent(null);
      }
      setPendingDeleteEvent(null);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax?.response?.data?.error || "Failed to delete");
    }
  };

  const replaceEventInState = useCallback(
    (updated: ScheduleEventCard) => {
      if (isAllClientsWorkspace) {
        const routedTenantId = updated.tenantId ?? workspaceTenantId ?? null;
        if (routedTenantId) {
          const normalized: ScheduleEventCard = {
            ...updated,
            tenantId: routedTenantId,
          };
          setTenantSegments((prev) =>
            prev.map((seg) =>
              seg.tenantId === routedTenantId
                ? {
                    ...seg,
                    events: seg.events.map((e) =>
                      e.id === normalized.id ? normalized : e
                    ),
                  }
                : seg
            )
          );
          return;
        }
        // All-Clients mode without a resolvable tenant — avoid null segment keys.
        setEvents((prev) => {
          const exists = prev.some((e) => e.id === updated.id);
          return exists
            ? prev.map((e) => (e.id === updated.id ? updated : e))
            : [...prev, updated];
        });
        return;
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    },
    [isAllClientsWorkspace, workspaceTenantId]
  );

  const openEventInspector = useCallback((evt: ScheduleEventCard) => {
    setInspectorEvent({ ...evt });
  }, []);

  const handleInspectorChange = useCallback(
    (patch: Partial<ScheduleEventCard>) => {
      setInspectorEvent((prev) => (prev ? { ...prev, ...patch } : null));
    },
    []
  );

  const saveInspectorChanges = async () => {
    if (!inspectorEvent) return;
    try {
      setInspectorSaving(true);
      setError(null);
      await withScheduleTenant(inspectorEvent.tenantId);

      const start = inspectorEvent.calendarDate
        ? buildDateForIsoAndTime(inspectorEvent.calendarDate, inspectorEvent.time)
        : buildDateForDayAndTime(
            inspectorEvent.day,
            inspectorEvent.time,
            calendarAnchor
          );
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + Math.max(1, inspectorEvent.duration));

      if (start >= end) {
        setError("Invalid time range - end time must be after start time");
        return;
      }

      const res = await updateScheduleMutation.mutateAsync({
        id: inspectorEvent.id,
        data: {
          playerId: inspectorEvent.roomId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          recurrence: inspectorEvent.loopPlayback ? "DAILY" : "ONCE",
        },
      });

      const mapped = scheduleEntryToEventCard(res.schedule);
      const next: ScheduleEventCard = {
        ...mapped,
        roomId: inspectorEvent.roomId,
        day: shortDayFromDate(start),
        time: inspectorEvent.time,
        calendarDate: start.toISOString().slice(0, 10),
        loopPlayback: inspectorEvent.loopPlayback,
        tenantId: inspectorEvent.tenantId,
        tenantLabel: inspectorEvent.tenantLabel,
      };

      replaceEventInState(next);
      setInspectorEvent(next);
    } catch (err: unknown) {
      handleScheduleError(err);
    } finally {
      setInspectorSaving(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();

  const hourDayColumns = useMemo((): DayColumn[] => {
    if (selectedDay === "all") return weekDays;
    return weekDays.filter((d) => d.short === selectedDay);
  }, [weekDays, selectedDay]);

  const filterEvents = useCallback(
    (
      source: ScheduleEventCard[],
      opts: {
        roomId?: string;
        day?: string;
        time?: string;
        calendarDate?: string;
      }
    ) => {
      return source.filter((e) => {
        if (opts.roomId && e.roomId !== opts.roomId) return false;
        if (selectedRoom !== "all" && e.roomId !== selectedRoom) return false;
        if (opts.calendarDate && e.calendarDate !== opts.calendarDate) return false;
        if (opts.day && e.day !== opts.day) return false;
        if (opts.time && !eventMatchesHour(e.time, opts.time)) return false;
        if (!normalizedQuery) return true;
        return e.title.toLowerCase().includes(normalizedQuery);
      });
    },
    [normalizedQuery, selectedRoom]
  );

  const defaultRoomId = useCallback(
    (segmentRooms: { id: string; name: string }[]) => {
      if (segmentRooms.length === 0) return "";
      if (selectedRoom !== "all") {
        return segmentRooms.some((r) => r.id === selectedRoom)
          ? selectedRoom
          : segmentRooms[0]?.id ?? "";
      }
      return segmentRooms[0]?.id ?? "";
    },
    [selectedRoom]
  );

  const formatDayHeader = (day: DayColumn) => (
    <>
      <div>{day.full}</div>
      <div className="text-[10px] text-gray-400 font-normal normal-case">
        {day.date}
      </div>
    </>
  );

  const renderWeekGrid = (
    segmentEvents: ScheduleEventCard[],
    segmentRooms: { id: string; name: string }[],
    segmentTenantId?: string
  ) => {
    const roomsForGrid =
      selectedRoom === "all"
        ? segmentRooms
        : segmentRooms.filter((r) => r.id === selectedRoom);
    if (roomsForGrid.length === 0) return null;

    return (
    <>
      {daysToShow.length > 0 && (
        <div
          className="grid border-b border-gray-200 dark:border-zinc-700/60 bg-gray-50 dark:bg-zinc-800/50 sticky top-0 z-20"
          style={{
            gridTemplateColumns: `repeat(${daysToShow.length}, minmax(0, 1fr))`,
          }}
        >
          {daysToShow.map((day) => (
            <div
              key={day.short}
              className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400 border-r border-gray-200 dark:border-zinc-800 last:border-r-0"
            >
              {formatDayHeader(day)}
            </div>
          ))}
        </div>
      )}
      {roomsForGrid.map((room) => (
        <div key={room.id} className="border-b border-gray-200 dark:border-zinc-800">
          <div className="font-medium px-4 py-2.5 bg-white dark:bg-zinc-800/50 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-zinc-700/60">
            {room.name}
          </div>
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, daysToShow.length)}, minmax(0, 1fr))`,
            }}
          >
            {daysToShow.map((day) => (
              <CalendarCell
                key={`${room.id}-${day.short}`}
                roomId={room.id}
                day={day.short}
                time="09:00"
                calendarDate={day.date}
                events={filterEvents(segmentEvents, {
                  roomId: room.id,
                  day: day.short,
                })}
                onDropEvent={handleDropEvent}
                onDropPlaylist={handleDropPlaylist}
                onEventDelete={setPendingDeleteEvent}
                onEventEdit={openEventInspector}
                compact={daysToShow.length > 3}
                onQuickCreate={(roomId, day, time, cal) =>
                  openAssignPicker(roomId, day, time, cal, segmentTenantId)
                }
              />
            ))}
          </div>
        </div>
      ))}
    </>
    );
  };

  const renderMonthGrid = (
    segmentEvents: ScheduleEventCard[],
    segmentRooms: { id: string; name: string }[],
    segmentTenantId?: string
  ) => (
    <div className="min-w-0">
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-700/60 bg-gray-50 dark:bg-zinc-800/50 text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      {monthWeeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800 min-h-[120px]">
          {week.map((cell, ci) => {
            const cellEvents =
              cell.inMonth && cell.date
                ? filterEvents(segmentEvents, { calendarDate: cell.date })
                : [];
            const dayShort =
              cell.date && cell.inMonth
                ? shortDayFromDate(new Date(cell.date))
                : "Mon";
            const slotTime = cellEvents[0]?.time?.slice(0, 5) || "09:00";
            const roomId = defaultRoomId(segmentRooms);

            return (
              <div
                key={`${wi}-${ci}`}
                className={cn(
                  "border-r border-gray-100 dark:border-zinc-800 p-2 min-h-[120px] flex flex-col",
                  !cell.inMonth && "bg-gray-50 dark:bg-zinc-800/30"
                )}
              >
                {cell.day != null && cell.inMonth && (
                  <>
                    <div className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 mb-1">{cell.day}</div>
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[200px]">
                      {cellEvents.map((evt) => (
                        <EventCard
                          key={evt.id}
                          evt={evt}
                          compact
                          onDelete={setPendingDeleteEvent}
                          onEdit={openEventInspector}
                        />
                      ))}
                    </div>
                    {roomId && (
                      <button
                        type="button"
                        aria-label="Add schedule item"
                        onClick={() =>
                          openAssignPicker(
                            roomId,
                            dayShort,
                            slotTime,
                            cell.date,
                            segmentTenantId
                          )
                        }
                        className="mt-1 w-full flex items-center justify-center rounded border border-dashed border-gray-200 dark:border-zinc-800 py-1 text-gray-400 hover:border-[#A473FF]/50 hover:text-[#A473FF]"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderDayGrid = (
    segmentEvents: ScheduleEventCard[],
    segmentRooms: { id: string; name: string }[],
    segmentTenantId?: string
  ) => {
    const roomsForGrid =
      selectedRoom === "all"
        ? segmentRooms
        : segmentRooms.filter((r) => r.id === selectedRoom);
    if (roomsForGrid.length === 0) return null;

    const dayEvents = filterEvents(segmentEvents, {
      calendarDate: dayColumn.date,
    });

    return (
      <DayTimelineGrid
        rooms={roomsForGrid}
        events={dayEvents}
        calendarDate={dayColumn.date}
        dayShort={dayColumn.short}
        onEventEdit={openEventInspector}
        onEventDelete={setPendingDeleteEvent}
        onQuickCreate={(roomId, day, time, cal) =>
          openAssignPicker(roomId, day, time, cal, segmentTenantId)
        }
      />
    );
  };

  const renderHourGrid = (
    segmentEvents: ScheduleEventCard[],
    segmentRooms: { id: string; name: string }[],
    segmentTenantId?: string
  ) => (
    <>
      <div
        className="grid border-b border-gray-200 dark:border-zinc-700/60 bg-gray-50 dark:bg-zinc-800/50 sticky top-0 z-20"
        style={{
          gridTemplateColumns: `80px repeat(${Math.max(1, hourDayColumns.length)}, minmax(0, 1fr))`,
        }}
      >
        <div className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 border-r border-gray-200 dark:border-zinc-800">
          Hour
        </div>
        {hourDayColumns.map((day) => (
          <div
            key={day.short}
            className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400 border-r border-gray-200 dark:border-zinc-800 last:border-r-0"
          >
            <div>{day.short}</div>
            <div className="text-[10px] text-gray-400 font-normal normal-case">
              {day.date}
            </div>
          </div>
        ))}
      </div>
      {HOUR_SLOTS.map((slot) => (
        <div
          key={slot}
          className="grid border-b border-gray-100 dark:border-zinc-800"
          style={{
            gridTemplateColumns: `80px repeat(${Math.max(1, hourDayColumns.length)}, minmax(0, 1fr))`,
          }}
        >
          <div className="px-2 py-3 text-xs text-gray-500 dark:text-zinc-400 border-r border-gray-100 dark:border-zinc-700/60 bg-gray-50 dark:bg-zinc-800/50">
            {slot}
          </div>
          {hourDayColumns.map((day) => {
            const roomId = defaultRoomId(segmentRooms);
            if (!roomId) return <div key={day.short} />;
            const cellEvents = filterEvents(segmentEvents, {
              day: day.short,
              time: slot,
              calendarDate: day.date,
            });
            return (
              <CalendarCell
                key={`${slot}-${day.short}`}
                roomId={roomId}
                day={day.short}
                time={slot}
                calendarDate={day.date}
                events={cellEvents}
                onDropEvent={handleDropEvent}
                onDropPlaylist={handleDropPlaylist}
                onEventDelete={setPendingDeleteEvent}
                onEventEdit={openEventInspector}
                compact
                onQuickCreate={(r, d, t, cal) =>
                  openAssignPicker(r, d, t, cal, segmentTenantId)
                }
              />
            );
          })}
        </div>
      ))}
    </>
  );

  if (authLoading || isLoading) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
          <ScheduleToolbar
            query={query}
            onQueryChange={setQuery}
            selectedRoom={selectedRoom}
            onChangeRoom={setSelectedRoom}
            selectedDay={selectedDay}
            onChangeDay={setSelectedDay}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            rooms={activeRooms}
            days={weekDays}
            showWorkspaceSelector={isSuperAdmin}
            workspaceClients={workspaceClients}
            selectedWorkspaceClientId={selectedWorkspaceClientId}
            activeWorkspaceClientName={activeWorkspaceClient?.name}
            onChangeWorkspaceClient={handleWorkspaceClientChange}
            calendarPeriodLabel={calendarPeriodLabel}
            onPrevPeriod={() => shiftCalendarPeriod(-1)}
            onNextPeriod={() => shiftCalendarPeriod(1)}
            onToday={resetCalendarToToday}
          />

          <div className="px-6 py-6">
            <div className="bg-white dark:bg-zinc-800/50 rounded-[28px] border border-gray-100 dark:border-zinc-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col min-h-[calc(100vh-220px)] overflow-hidden">
              <div className="flex-1 overflow-auto p-6">
                <div className="animate-pulse">
                  {viewMode === "month" ? (
                    <>
                      <div className="grid grid-cols-7 gap-3 mb-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="h-8 bg-gray-200 rounded" />
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 4 * 7 }).map((_, i) => (
                          <div key={i} className="h-24 bg-gray-200 rounded" />
                        ))}
                      </div>
                    </>
                  ) : viewMode === "day" ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-gray-200 rounded w-full" />
                      <div className="h-[480px] bg-gray-100 rounded-xl" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-14 bg-gray-200 rounded" />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
        <ScheduleToolbar
          query={query}
          onQueryChange={setQuery}
          selectedRoom={selectedRoom}
          onChangeRoom={setSelectedRoom}
          selectedDay={selectedDay}
          onChangeDay={setSelectedDay}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          rooms={activeRooms}
          days={weekDays}
          showWorkspaceSelector={isSuperAdmin}
          workspaceClients={workspaceClients}
          selectedWorkspaceClientId={selectedWorkspaceClientId}
          activeWorkspaceClientName={activeWorkspaceClient?.name}
          onChangeWorkspaceClient={handleWorkspaceClientChange}
          calendarPeriodLabel={calendarPeriodLabel}
          onPrevPeriod={() => shiftCalendarPeriod(-1)}
          onNextPeriod={() => shiftCalendarPeriod(1)}
          onToday={resetCalendarToToday}
        />

      <div className="px-6 py-6">
        <div className="bg-white dark:bg-zinc-800/50 rounded-[28px] border border-gray-100 dark:border-zinc-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col min-h-[calc(100vh-220px)] overflow-hidden">
          <div className="flex-1 overflow-auto">
            {error && (
              <div className="mx-4 my-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
                <button
                  type="button"
                  className="ml-auto text-xs underline"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {isSuperAdmin && !workspaceTenantId && !isAllClientsWorkspace ? (
              <div className="flex items-center justify-center h-full min-h-[240px]">
                <div className="text-center max-w-md px-4">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    Select a client workspace
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    Choose an active client or All Clients from the dropdown above.
                  </p>
                </div>
              </div>
            ) : (
              renderScheduleBody()
            )}
          </div>
        </div>
      </div>

        <ConfirmDialog
          open={!!pendingDeleteEvent}
          title="Remove from schedule?"
          description={
            pendingDeleteEvent
              ? `Remove "${pendingDeleteEvent.title}"?`
              : undefined
          }
          confirmLabel="Remove"
          cancelLabel="Keep"
          onCancel={() => setPendingDeleteEvent(null)}
          onConfirm={confirmDeleteEvent}
        />

        <ScheduleAssignModal
          open={assignModalOpen}
          workspaceTenantId={assignModalTenantId}
          onClose={() => {
            setAssignModalOpen(false);
            setPickerCell(null);
          }}
          onSelectAudio={handleSelectAudio}
          onSelectPlaylist={handleSelectPlaylist}
        />

        <InspectorPanel
          open={!!inspectorEvent}
          event={inspectorEvent}
          rooms={inspectorRooms}
          saving={inspectorSaving}
          onClose={() => setInspectorEvent(null)}
          onChange={handleInspectorChange}
          onSave={saveInspectorChanges}
        />
      </div>
    </DndProvider>
  );
}