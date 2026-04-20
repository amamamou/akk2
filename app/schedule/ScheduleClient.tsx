"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Search, ChevronRight, ChevronDown, ChevronUp, Plus, Music } from "lucide-react";
import DraggableAudioCard from "./components/DraggableAudioCard";
import CalendarCell from "./components/CalendarCell";
import ScheduleToolbar from "./components/ScheduleToolbar";
import { cn } from "../../utils/cn";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Types
type AudioItem = { id: string; title: string; duration: number; type: string; url?: string };
type ScheduleEvent = { id: string; audioId: string; title: string; duration: number; roomId: string; day: string; time: string };

const PLAYERS_STORAGE_KEY = "akou.players";
const SCHEDULE_STORAGE_KEY = "akou.scheduleEvents";

// Mock Data
// Rooms are now derived at runtime from real players stored under PLAYERS_STORAGE_KEY
// (see rooms state in the component below).

const weekDays = [
  { short: "Mon", full: "Monday", date: "24" },
  { short: "Tue", full: "Tuesday", date: "25" },
  { short: "Wed", full: "Wednesday", date: "26" },
  { short: "Thu", full: "Thursday", date: "27" },
  { short: "Fri", full: "Friday", date: "28" },
  { short: "Sat", full: "Saturday", date: "29" },
  { short: "Sun", full: "Sunday", date: "30" },
];

const initialAudioLibrary: AudioItem[] = [
  { id: "a1", title: "Morning Flow", duration: 60, type: "Yoga" },
  { id: "a2", title: "Deep Focus", duration: 120, type: "Meditation" },
  { id: "a3", title: "Lobby Ambience Loop", duration: 180, type: "Lobby" },
  { id: "a4", title: "Nature Walk", duration: 60, type: "Meditation" },
  { id: "a5", title: "Upbeat Playlist", duration: 90, type: "Retail" },
  { id: "a6", title: "Evening Rest", duration: 60, type: "Yoga" },
];

const initialEvents: ScheduleEvent[] = [];

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const roomIdFromUrl = searchParams.get("roomId");

  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const [pendingDeleteEvent, setPendingDeleteEvent] =
    useState<ScheduleEvent | null>(null);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  // currentWeek kept for future use (display controls)
  const [selectedRoom, setSelectedRoom] = useState<string | "all">(
    roomIdFromUrl || "all",
  );

  // Load real players from the same storage used by PlayersClient and
  // build a de-duplicated rooms list from them. Also listen to storage
  // events so other tabs updating players are reflected here without reload.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadRoomsFromStorage = () => {
      try {
        const raw = window.localStorage.getItem(PLAYERS_STORAGE_KEY);
        if (!raw) {
          setRooms([]);
          return;
        }

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          setRooms([]);
          return;
        }

        type StoredPlayer = {
          id?: string;
          roomId?: string;
          roomName?: string;
          playerName?: string;
        };

        // Build one schedule row per *player* (using the player id),
        // so all players show up even if some share the same roomId label.
        const map: Record<string, { id: string; name: string }> = {};
        for (const player of parsed as StoredPlayer[]) {
          const id = player.id ?? player.roomId;
          const name =
            player.roomName ??
            player.playerName ??
            player.roomId ??
            "Unnamed room";
          if (!id) continue;
          map[id] = { id, name };
        }

        setRooms(Object.values(map));
      } catch (err) {
        console.error("Failed to load players for schedule", err);
      }
    };

    // Initial load for when you navigate to the schedule page.
    loadRoomsFromStorage();

    // Keep in sync if players are edited in another tab.
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PLAYERS_STORAGE_KEY) {
        loadRoomsFromStorage();
      }
    };

    // And also in the same tab when PlayersClient updates its state.
    const handlePlayersUpdated = () => {
      loadRoomsFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("akou:players-updated", handlePlayersUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("akou:players-updated", handlePlayersUpdated);
    };
  }, []);

  // Keep selected room in sync with the URL param and gently scroll it into view.
  useEffect(() => {
    if (!roomIdFromUrl) return;
    setSelectedRoom(roomIdFromUrl);
    const el = document.getElementById(roomIdFromUrl);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [roomIdFromUrl]);
  const [view] = useState<"timeline" | "list" | "day">("timeline");
  const [query, setQuery] = useState("");
  const [compact] = useState(false);
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({});
  // Filters for Focus Mode
  const [selectedDay, setSelectedDay] = useState<string | "all">("all");
  // Audio drawer states
  const [audioQuery, setAudioQuery] = useState("");
  const [audioType, setAudioType] = useState<string | "all">("all");
  const [audioSort, setAudioSort] = useState<string>("newest");
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState<number>(160);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const persistEvents = useCallback((next: ScheduleEvent[]) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent("akou:schedule-updated", {
            detail: { count: next.length },
          }),
        );
      }
    } catch (err) {
      console.error("Failed to persist schedule events", err);
    }
  }, []);

  // Load any previously saved schedule events on mount so the
  // calendar (and dashboard) can reflect "real" upcoming items.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      setEvents(parsed as ScheduleEvent[]);
    } catch (err) {
      console.error("Failed to read schedule events from storage", err);
    }
  }, []);

  // resize helpers
  const resizingRef = useRef<{ startY: number; startH: number } | null>(null);

  const handleDropEvent = (item: AudioItem, roomId: string, day: string, time: string) => {
    setEvents((prev) => {
      const next: ScheduleEvent[] = [
        ...prev,
        {
          id: `e-${Date.now()}`,
          audioId: item.id,
          title: item.title,
          duration: item.duration,
          roomId,
          day,
          time,
        },
      ];
      persistEvents(next);
      return next;
    });
  };

  // Clicking events no longer opens an inspector panel.
  const handleEventClick = () => {
    // noop - inspector removed per design
  };

  const toggleRoom = (roomId: string) => {
    setCollapsedRooms((prev) => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const handlePreview = useCallback((id: string) => {
    const item = initialAudioLibrary.find(a => a.id === id);
    if (!item) return;
    // if no URL provided, just toggle previewId to show playing UI but don't attempt playback
    if (!item.url) {
      setPreviewId((p) => p === id ? null : id);
      return;
    }
    // For items with a url property (if present), toggle playback
    const url = item.url;
    if (!url) {
      setPreviewId((p) => p === id ? null : id);
      return;
    }
    if (!audioElRef.current) audioElRef.current = document.createElement('audio');
    const el = audioElRef.current;
    if (previewId === id) {
      el.pause();
      setPreviewId(null);
    } else {
      el.src = url;
      el.play().catch(() => {});
      setPreviewId(id);
    }
  }, [previewId]);

  // resizing handlers
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = resizingRef.current.startY - e.clientY;
      const newH = Math.max(120, Math.min(600, resizingRef.current.startH + delta));
      setDrawerHeight(newH);
    };
    const onUp = () => { resizingRef.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // derive visible lists (apply filters inside the grid)
  const roomsToShow = selectedRoom === "all" ? rooms : rooms.filter(r => r.id === selectedRoom);
  const weekDaysToShow = selectedDay === "all" ? weekDays : weekDays.filter(d => d.short === selectedDay);

  const requestDeleteEvent = (evt: ScheduleEvent) => {
    setPendingDeleteEvent(evt);
  };

  const cancelDeleteEvent = () => {
    setPendingDeleteEvent(null);
  };

  const confirmDeleteEvent = () => {
    if (!pendingDeleteEvent) return;
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== pendingDeleteEvent.id);
      persistEvents(next);
      return next;
    });
    setPendingDeleteEvent(null);
  };

  // Collapsed-day drop target component so collapsed cells accept audio drops
  function CollapsedDayCell({ roomId, dayShort, countForDay }: { roomId: string; dayShort: string; countForDay: number }) {
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: "audio",
      // When a room is collapsed, we still want drops to land at sensible,
      // varied times rather than everything at 09:00. Stagger each new
      // event by 1 hour starting from 09:00 for that room/day.
      drop: (item: AudioItem) => {
        const indexForDay = countForDay;
        const baseHour = 9; // 09:00
        const hour = Math.min(baseHour + indexForDay, 21); // cap at 21:00
        const timeForDrop = `${hour.toString().padStart(2, "0")}:00`;
        handleDropEvent(item, roomId, dayShort, timeForDrop);
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }));

    const playlistLength = countForDay;

    return (
      <div
        ref={(el) => (dropRef as unknown as (instance: HTMLDivElement | null) => void)(el)}
        className={cn("flex-1 min-w-[140px] border-l border-gray-200 px-4 py-3 flex items-center justify-center group relative")}
      >
        {isOver && <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-gray-300 bg-white/60 animate-fade z-40" />}
        {countForDay === 0 ? (
          <button aria-label="Quick create" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-white border border-gray-100 text-gray-400 hover:bg-gray-50">
            <Plus size={14} />
          </button>
        ) : (
          <div className="inline-flex items-center justify-center">
            {/* Playlist info */}
            {playlistLength > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRoom(roomId);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md font-medium hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Expand room"
              >
                <Music size={12} className="text-gray-500 shrink-0" />
                <span className="truncate">
                  {playlistLength} {playlistLength === 1 ? "track" : "tracks"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // filtering computed in roomsToShow / weekDaysToShow and applied inside the grid

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn("flex-1 flex flex-col overflow-hidden bg-white")}>
        <ScheduleToolbar
          query={query}
          onQueryChange={setQuery}
          selectedRoom={selectedRoom}
          onChangeRoom={(r) => setSelectedRoom(r as string)}
          selectedDay={selectedDay}
          onChangeDay={(d) => setSelectedDay(d as string)}
          rooms={rooms}
          days={weekDays}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Main Calendar Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-auto bg-white">
              {rooms.length === 0 ? (
                <div className="h-full flex items-center justify-center px-6 py-12">
                  <div className="text-center max-w-md space-y-3">
                    <h2 className="text-sm font-semibold text-gray-900">
                      No players yet
                    </h2>
                    <p className="text-xs text-gray-500">
                      To start scheduling audio, first create at least one player in the
                      <span className="font-medium text-gray-700"> Players</span> page.
                      Each player appears here as a row in the weekly schedule.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => (window.location.href = "/players")}
                        className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Go to Players
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                  <div className="min-w-max">
                    {/* List View */}
                    {view === "list" && (
                      <div className="p-4">
                        <div className="space-y-2">
                          {events.filter(e => e.title.toLowerCase().includes(query.toLowerCase())).map(evt => (
                            <div key={evt.id} className="flex items-center justify-between bg-gray-50 border-transparent rounded-md p-3">
                              <div className="flex items-center gap-4">
                                <div className="text-sm font-medium text-gray-900">{evt.title}</div>
                                <div className="text-xs text-gray-500">{evt.duration}m • {evt.day}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => requestDeleteEvent(evt)}
                                  className="text-red-500 p-1 rounded hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Day View */}
                    {view === "day" && (
                      <div className="p-4">
                        <div className="text-sm font-medium text-gray-700 mb-4">{weekDays[0].full}</div>
                        <div className="grid grid-cols-1 gap-2">
                          {rooms.flatMap(room => events.filter(e => e.roomId === room.id && e.day === weekDays[0].short)).map(evt => (
                            <div key={evt.id} className="bg-gray-50 border-transparent rounded-md p-3 flex items-center justify-between hover:bg-gray-100">
                              <div className="text-sm font-medium text-gray-900">{evt.title}</div>
                              <div className="text-xs text-gray-500">{evt.duration}m • {evt.roomId}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {view === "timeline" && (
                      <>
                        <div className="flex sticky top-0 z-10 bg-white">
                          <div className="w-40 flex-shrink-0 border-r border-gray-100 bg-white sticky left-0 z-20" />
                          {weekDaysToShow.map((day) => (
                            <div key={day.short} className="flex-1 min-w-[120px] border-l border-gray-200 py-4 px-6 text-center flex flex-col items-center justify-center">
                              <button
                                aria-label={`${day.full} ${day.date}`}
                                onClick={() => setSelectedDay(selectedDay === day.short ? 'all' : day.short)}
                                className="focus:outline-none"
                              >
                                <div className="text-xs font-semibold text-gray-800 uppercase tracking-wide">{day.short}</div>
                                <div className="mt-2">
                                  <div className={cn(
                                    "inline-flex items-center justify-center h-8 min-w-[40px] px-3 text-gray-900 text-sm font-semibold rounded-md",
                                    // subtle square chip hover only on the inner date element
                                    "hover:bg-gray-50 cursor-pointer"
                                  )}>
                                    {day.date}
                                  </div>
                                </div>
                                <div className="sr-only">{day.full}</div>
                              </button>
                            </div>
                          ))}
                        </div>

                                        {roomsToShow.map((room) => {
                                          const collapsed = !!collapsedRooms[room.id];
                                          return (
                                            <div
                                              key={room.id}
                                              id={room.id}
                                              className={`flex border-b border-gray-200 bg-white`}
                                            >
                              <div className="w-40 flex-shrink-0 border-r border-gray-100 bg-transparent p-3 flex items-center justify-between sticky left-0 z-20">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => toggleRoom(room.id)} className="p-1 rounded hover:bg-gray-100 text-gray-600" aria-label={collapsed ? "Expand room" : "Collapse room"}>
                                    {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                  <button onClick={() => setSelectedRoom(selectedRoom === room.id ? 'all' : room.id)} className="text-sm font-medium text-gray-900 text-left">
                                    {room.name}
                                  </button>
                                </div>

                              </div>

                              {collapsed ? (
                                // When a room is collapsed show a compact per-day count pill for each day
                                weekDaysToShow.map((day) => {
                                  const countForDay = events.filter(e => e.roomId === room.id && e.day === day.short).length;
                                    return (
                                      <CollapsedDayCell key={`${room.id}-collapsed-${day.short}`} roomId={room.id} dayShort={day.short} countForDay={countForDay} />
                                    );
                                  })
                              ) : (
                                weekDaysToShow.map((day) => {
                                  const cellEvents = events.filter(e => e.roomId === room.id && e.day === day.short && e.title.toLowerCase().includes(query.toLowerCase()));
                                  return (
                                    <div key={`${room.id}-${day.short}`} className="flex-1 min-w-[140px] border-l border-gray-200">
                                      <CalendarCell
                                        roomId={room.id}
                                        day={day.short}
                                        time="09:00"
                                        events={cellEvents}
                                        onDropEvent={handleDropEvent}
                                        onEventClick={handleEventClick}
                                        onEventDelete={requestDeleteEvent}
                                        compact={compact}
                                      />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
              )}
            </div>

            {/* Bottom Audio Drawer (sticky & visible) */}
              <div className="sticky bottom-0 z-50 border-t border-gray-200 bg-white flex-shrink-0 flex flex-col shadow-lg" style={{ height: drawerCollapsed ? 50 : drawerHeight }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Audio Library</h3>
                  {!drawerCollapsed && <div className="text-xs text-gray-500">Drag into schedule</div>}
                </div>

                <div className="flex items-center gap-2">
                  {!drawerCollapsed ? (
                    <>
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={audioQuery}
                          onChange={(e) => setAudioQuery(e.target.value)}
                          placeholder="Search audio..."
                          className="pl-8 pr-3 py-1 text-sm rounded-md w-56 bg-gray-50 focus:outline-none"
                        />
                      </div>

                      <select value={audioType} onChange={(e) => setAudioType(e.target.value)} className="text-sm px-3 py-1.5 rounded-md bg-gray-50 border border-transparent">
                        <option value="all">All types</option>
                        {[...new Set(initialAudioLibrary.map(a => a.type))].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <select value={audioSort} onChange={(e) => setAudioSort(e.target.value)} className="text-sm px-3 py-1.5 rounded-md bg-gray-50 border border-transparent">
                        <option value="newest">Newest</option>
                        <option value="title">Title</option>
                        <option value="duration">Duration</option>
                      </select>

                      <div className="ml-2 flex items-center gap-2">
                        <button onClick={() => setDrawerCollapsed(true)} aria-label="Collapse audio drawer" title="Collapse" className="p-2 rounded-md text-gray-500 hover:text-gray-700 cursor-pointer">
                          <ChevronDown size={16} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="ml-2">
                      <button onClick={() => setDrawerCollapsed(false)} aria-label="Expand audio drawer" title="Expand" className="p-2 rounded-md text-gray-500 hover:text-gray-700 cursor-pointer">
                        <ChevronUp size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto py-3 px-3" style={{ height: drawerCollapsed ? 0 : undefined }}>
                <div className="flex gap-3 items-start flex-wrap">
                  {(() => {
                    const q = audioQuery.trim().toLowerCase();
                    let list = initialAudioLibrary.filter(a => {
                      if (audioType !== 'all' && a.type !== audioType) return false;
                      if (q && !a.title.toLowerCase().includes(q)) return false;
                      return true;
                    });
                    if (audioSort === 'title') list = [...list].sort((x,y) => x.title.localeCompare(y.title));
                    if (audioSort === 'duration') list = [...list].sort((x,y) => x.duration - y.duration);
                    // newest keeps original order
                    return list.map(audio => (
                      <DraggableAudioCard key={audio.id} audio={audio} onPreview={handlePreview} isPreviewing={previewId === audio.id} />
                    ));
                  })()}
                </div>
              </div>
              {/* resize handle */}
              <div
                onMouseDown={(e) => { resizingRef.current = { startY: e.clientY, startH: drawerHeight }; document.body.style.userSelect = 'none'; }}
                className="h-2 bg-transparent cursor-row-resize text-center"
                title="Drag to resize"
              />
            </div>
          </div>

          {/* Inspector Panel (right side) */}
          {/* Inspector panel removed - event details modal no longer opens */}
        </div>
      </div>
      <ConfirmDialog
        open={!!pendingDeleteEvent}
        title="Remove from schedule"
        description={
          pendingDeleteEvent
            ? `This will remove “${pendingDeleteEvent.title}” from the schedule. The audio stays available in your library.`
            : undefined
        }
        confirmLabel="Remove event"
        cancelLabel="Keep event"
        onCancel={cancelDeleteEvent}
        onConfirm={confirmDeleteEvent}
      />
    </DndProvider>
  );
}
