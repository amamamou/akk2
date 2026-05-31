"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AlertCircle, Loader } from "lucide-react";
import ScheduleToolbar from "./components/ScheduleToolbar";
import CalendarCell from "./components/CalendarCell";
import ScheduleAssignModal, { type PlaylistPick } from "./components/ScheduleAssignModal";
import type { ScheduleEventCard } from "./components/EventCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import type { ClientInfo, ScheduleEntry } from "@/types/api";

type AudioItem = {
  id: string;
  title: string;
  duration: number;
  type: string;
  url?: string;
};

const weekDays = [
  { short: "Mon", full: "Monday", date: "01" },
  { short: "Tue", full: "Tuesday", date: "02" },
  { short: "Wed", full: "Wednesday", date: "03" },
  { short: "Thu", full: "Thursday", date: "04" },
  { short: "Fri", full: "Friday", date: "05" },
  { short: "Sat", full: "Saturday", date: "06" },
  { short: "Sun", full: "Sunday", date: "07" },
];

const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildDateForDayAndTime(day: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const dayIndex = shortDays.indexOf(day);
  const date = new Date();
  const current = date.getDay();
  const diff = dayIndex === -1 ? 0 : (dayIndex - current + 7) % 7;
  date.setDate(date.getDate() + diff);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function shortDayFromDate(date: Date) {
  return shortDays[date.getDay()] || "Mon";
}

function scheduleEntryToEvent(entry: ScheduleEntry): ScheduleEventCard {
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
    time: startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function playlistDurationMinutes(trackCount: number) {
  return Math.max(15, trackCount * 4);
}

function normalizeScheduleClient(raw: Record<string, unknown>): ClientInfo {
  return {
    id: String(raw.id ?? ""),
    tenantId: (raw.tenantId ?? raw.tenant_id) as string | undefined,
    name: String(raw.name ?? "Untitled client"),
    businessType: String(raw.businessType ?? raw.business_type ?? ""),
    contactPerson: String(raw.contactPerson ?? raw.contact_person ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    status: (String(raw.status ?? "INACTIVE").toUpperCase() as ClientInfo["status"]),
    subscriptionTier: (raw.subscriptionTier ??
      raw.subscription_tier ??
      "STARTER") as ClientInfo["subscriptionTier"],
    maxPlayers: Number(raw.maxPlayers ?? raw.max_players ?? 0),
    maxStorageGb: Number(raw.maxStorageGb ?? raw.max_storage_gb ?? 0),
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
  };
}

export default function ScheduleClientPage() {
  const apiClient = getApiClient();
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
    useState<string>("");
  const [workspaceTenantId, setWorkspaceTenantId] = useState<string | null>(
    null
  );
  const [pendingDeleteEvent, setPendingDeleteEvent] =
    useState<ScheduleEventCard | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [pickerCell, setPickerCell] = useState<{
    roomId: string;
    day: string;
    time: string;
  } | null>(null);

  const workspaceReady = !isSuperAdmin || Boolean(workspaceTenantId);

  useEffect(() => {
    if (!isSuperAdmin || authLoading) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await apiClient.listClients();
        if (cancelled) return;
        const eligible = (res?.clients ?? [])
          .map((c: Record<string, unknown>) => normalizeScheduleClient(c))
          .filter(
            (c: ClientInfo) =>
              c.status === "ACTIVE" &&
              Boolean(c.tenantId && String(c.tenantId).trim())
          )
          .map((c: ClientInfo) => ({
            id: c.id,
            name: c.name,
            tenantId: String(c.tenantId),
          }));
        setWorkspaceClients(eligible);
        if (eligible.length > 0 && !selectedWorkspaceClientId) {
          setSelectedWorkspaceClientId(eligible[0].id);
          setWorkspaceTenantId(eligible[0].tenantId);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax?.response?.data?.error || "Failed to load client workspaces");
        setWorkspaceClients([]);
      }
    })();

    return () => {
      cancelled = true;
      apiClient.clearWorkspaceTenant();
    };
  }, [apiClient, isSuperAdmin, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (isSuperAdmin && !workspaceTenantId) {
      setIsLoading(false);
      setRooms([]);
      setAudio([]);
      setEvents([]);
      return;
    }

    if (isSuperAdmin && workspaceTenantId) {
      apiClient.setWorkspaceTenant(workspaceTenantId);
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [playersRes, mediaRes, schedulesRes] = await Promise.all([
          apiClient.listPlayers(),
          apiClient.listMedia(),
          apiClient.listSchedules(),
        ]);
        if (cancelled) return;

        setRooms(
          playersRes.players.map((p) => ({
            id: p.id,
            name: p.roomName || p.playerName || "Unnamed",
          }))
        );

        setAudio(
          mediaRes.media.map((m) => ({
            id: m.id,
            title: m.title,
            duration:
              m.durationMinutes && m.durationMinutes > 0
                ? m.durationMinutes
                : 60,
            type: m.category || "Audio",
            url: m.url,
          }))
        );

        setEvents(
          (schedulesRes.schedules ?? []).map((s) => scheduleEntryToEvent(s))
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax?.response?.data?.error || "Failed to load schedule");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [apiClient, authLoading, isSuperAdmin, workspaceTenantId]);

  const handleWorkspaceClientChange = (clientId: string) => {
    const match = workspaceClients.find((c) => c.id === clientId);
    if (!match) return;
    setSelectedWorkspaceClientId(clientId);
    setWorkspaceTenantId(match.tenantId);
    setSelectedRoom("all");
    setSelectedDay("all");
    setError(null);
  };

  const roomsToShow = useMemo(
    () =>
      selectedRoom === "all"
        ? rooms
        : rooms.filter((r) => r.id === selectedRoom),
    [rooms, selectedRoom]
  );

  const daysToShow = useMemo(
    () =>
      selectedDay === "all"
        ? weekDays
        : weekDays.filter((d) => d.short === selectedDay),
    [selectedDay]
  );

  const appendEventFromResponse = useCallback(
    (schedule: ScheduleEntry, roomId: string, day: string, time: string) => {
      const mapped = scheduleEntryToEvent(schedule);
      setEvents((prev) => [
        ...prev,
        {
          ...mapped,
          roomId,
          day,
          time,
        },
      ]);
    },
    []
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

  const createAudioSchedule = async (
    item: AudioItem,
    roomId: string,
    day: string,
    time: string
  ) => {
    const start = buildDateForDayAndTime(day, time);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + Math.max(1, item.duration));
    if (start >= end) {
      setError("Invalid time range - end time must be after start time");
      return;
    }
    const res = await apiClient.createSchedule({
      playerId: roomId,
      mediaId: item.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      recurrence: "ONCE",
    });
    appendEventFromResponse(res.schedule, roomId, day, time);
  };

  const createPlaylistSchedule = async (
    playlist: PlaylistPick,
    roomId: string,
    day: string,
    time: string
  ) => {
    const start = buildDateForDayAndTime(day, time);
    const end = new Date(start);
    const minutes = playlistDurationMinutes(playlist.trackCount);
    end.setMinutes(end.getMinutes() + minutes);
    if (start >= end) {
      setError("Invalid time range - end time must be after start time");
      return;
    }
    const res = await apiClient.createSchedule({
      playerId: roomId,
      playlistId: playlist.playlistId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      recurrence: "ONCE",
    });
    appendEventFromResponse(res.schedule, roomId, day, time);
  };

  const handleDropEvent = async (
    item: AudioItem,
    roomId: string,
    day: string,
    time: string
  ) => {
    try {
      setError(null);
      await createAudioSchedule(item, roomId, day, time);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const handleDropPlaylist = async (
    item: PlaylistPick,
    roomId: string,
    day: string,
    time: string
  ) => {
    try {
      setError(null);
      await createPlaylistSchedule(item, roomId, day, time);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const handleSelectAudio = async (item: AudioItem) => {
    if (!pickerCell) return;
    try {
      setError(null);
      await createAudioSchedule(
        item,
        pickerCell.roomId,
        pickerCell.day,
        pickerCell.time
      );
      setAssignModalOpen(false);
      setPickerCell(null);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const handleSelectPlaylist = async (playlist: PlaylistPick) => {
    if (!pickerCell) return;
    try {
      setError(null);
      await createPlaylistSchedule(
        playlist,
        pickerCell.roomId,
        pickerCell.day,
        pickerCell.time
      );
      setAssignModalOpen(false);
      setPickerCell(null);
    } catch (err: unknown) {
      handleScheduleError(err);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!pendingDeleteEvent) return;
    try {
      await apiClient.deleteSchedule(pendingDeleteEvent.id);
      setEvents((prev) => prev.filter((e) => e.id !== pendingDeleteEvent.id));
      setPendingDeleteEvent(null);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax?.response?.data?.error || "Failed to delete");
    }
  };

  const normalizedQuery = query.trim().toLowerCase();

  if (authLoading || (isLoading && workspaceReady)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <ScheduleToolbar
          query={query}
          onQueryChange={setQuery}
          selectedRoom={selectedRoom}
          onChangeRoom={setSelectedRoom}
          selectedDay={selectedDay}
          onChangeDay={setSelectedDay}
          rooms={rooms}
          days={weekDays}
          showWorkspaceSelector={isSuperAdmin}
          workspaceClients={workspaceClients}
          selectedWorkspaceClientId={selectedWorkspaceClientId}
          onChangeWorkspaceClient={handleWorkspaceClientChange}
        />

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

          {isSuperAdmin && !workspaceTenantId ? (
            <div className="flex items-center justify-center h-full min-h-[240px]">
              <div className="text-center max-w-md px-4">
                <h2 className="font-semibold text-gray-900">
                  Select a client workspace
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose an active client from the dropdown above to view and
                  manage that tenant&apos;s weekly schedule.
                </p>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[240px]">
              <div className="text-center">
                <h2 className="font-semibold text-gray-900">No players yet</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Create a player in the Players page to get started
                </p>
              </div>
            </div>
          ) : roomsToShow.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[240px] text-sm text-gray-500">
              No room matches the selected filter.
            </div>
          ) : (
            <div className="min-w-0">
              {daysToShow.length > 0 && (
                <div
                  className="grid border-b border-gray-200 bg-gray-50 sticky top-0 z-20"
                  style={{
                    gridTemplateColumns: `repeat(${daysToShow.length}, minmax(0, 1fr))`,
                  }}
                >
                  {daysToShow.map((day) => (
                    <div
                      key={day.short}
                      className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 border-r border-gray-200 last:border-r-0"
                    >
                      {day.full}
                    </div>
                  ))}
                </div>
              )}

              {roomsToShow.map((room) => (
                <div key={room.id} className="border-b border-gray-200">
                  <div className="font-medium px-4 py-2.5 bg-white text-sm text-gray-900 border-b border-gray-100">
                    {room.name}
                    {selectedRoom !== "all" ? null : (
                      <span className="text-gray-400 font-normal ml-2">
                        · {daysToShow.map((d) => d.short).join(", ")}
                      </span>
                    )}
                  </div>
                  <div
                    className="grid w-full"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(1, daysToShow.length)}, minmax(0, 1fr))`,
                    }}
                  >
                    {daysToShow.map((day) => {
                      const cellEvents = events.filter((e) => {
                        if (e.roomId !== room.id || e.day !== day.short) {
                          return false;
                        }
                        if (!normalizedQuery) return true;
                        return e.title.toLowerCase().includes(normalizedQuery);
                      });
                      return (
                        <CalendarCell
                          key={`${room.id}-${day.short}`}
                          roomId={room.id}
                          day={day.short}
                          time="09:00"
                          events={cellEvents}
                          onDropEvent={handleDropEvent}
                          onDropPlaylist={handleDropPlaylist}
                          onEventDelete={setPendingDeleteEvent}
                          compact={daysToShow.length > 3}
                          onQuickCreate={(r, d, t) => {
                            setPickerCell({ roomId: r, day: d, time: t });
                            setAssignModalOpen(true);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          onClose={() => {
            setAssignModalOpen(false);
            setPickerCell(null);
          }}
          audio={audio}
          onSelectAudio={handleSelectAudio}
          onSelectPlaylist={handleSelectPlaylist}
        />
      </div>
    </DndProvider>
  );
}
