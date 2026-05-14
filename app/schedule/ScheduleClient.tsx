"use client";
import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AlertCircle, Loader } from "lucide-react";
import ScheduleToolbar from "./components/ScheduleToolbar";
import CalendarCell from "./components/CalendarCell";
import SongPickerModal from "./components/SongPickerModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getApiClient } from "@/lib/api-client";

type AudioItem = { id: string; title: string; duration: number; type: string; url?: string };
type ScheduleEvent = { id: string; audioId: string; title: string; duration: number; roomId: string; day: string; time: string };

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

export default function ScheduleClientPage() {
  const apiClient = getApiClient();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [audio, setAudio] = useState<AudioItem[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [audioQuery, setAudioQuery] = useState("");
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<ScheduleEvent | null>(null);
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [pickerCell, setPickerCell] = useState<{ roomId: string; day: string; time: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const ftp = await Promise.all([
          apiClient.listPlayers(),
          apiClient.listMedia(),
          apiClient.listSchedules(),
        ]);

        setRooms(ftp[0].players.map(p => ({
          id: p.id,
          name: p.roomName || p.playerName || "Unnamed",
        })));

        setAudio(ftp[1].media.map(m => ({
          id: m.id,
          title: m.title,
          duration: m.durationMinutes && m.durationMinutes > 0 ? m.durationMinutes : 60,
          type: m.category || "Audio",
          url: m.url,
        })));

        setEvents(ftp[2].schedules.map(s => {
          const sd = new Date(s.startsAt);
          return {
            id: s.id,
            audioId: s.mediaId,
            title: s.title,
            duration: 60,
            roomId: s.playerId,
            day: shortDayFromDate(sd),
            time: sd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          };
        }));
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [apiClient]);

   const handleDropEvent = async (item: AudioItem, roomId: string, day: string, time: string) => {
     try {
       const start = buildDateForDayAndTime(day, time);
       const end = new Date(start);
       const durationMinutes = Math.max(1, item.duration); // Ensure at least 1 minute
       end.setMinutes(end.getMinutes() + durationMinutes);

       // Validate times before sending
       if (start >= end) {
         setError('Invalid time range - end time must be after start time');
         return;
       }

       const res = await apiClient.createSchedule({
         playerId: roomId,
         mediaId: item.id,
         startTime: start.toISOString(),
         endTime: end.toISOString(),
         recurrence: "ONCE",
       });

       setEvents(prev => [...prev, {
         id: res.schedule.id,
         audioId: item.id,
         title: item.title,
         duration: item.duration,
         roomId, day, time,
       }]);
     } catch (err: any) {
       const status = err?.response?.status;
       const body = err?.response?.data;
       if (status === 409 || body?.code === 'TIME_CONFLICT') {
         setError('This time slot is already taken!');
       } else {
         setError(body?.error || body?.detail || err?.message || 'Failed to create schedule');
       }
     }
   };

   const handleSelectSong = async (item: AudioItem) => {
     if (!pickerCell) return;
     try {
       const start = buildDateForDayAndTime(pickerCell.day, pickerCell.time);
       const end = new Date(start);
       const durationMinutes = Math.max(1, item.duration); // Ensure at least 1 minute
       end.setMinutes(end.getMinutes() + durationMinutes);

       // Validate times before sending
       if (start >= end) {
         setError('Invalid time range - end time must be after start time');
         return;
       }

       const res = await apiClient.createSchedule({
         playerId: pickerCell.roomId,
         mediaId: item.id,
         startTime: start.toISOString(),
         endTime: end.toISOString(),
         recurrence: "ONCE",
       });

       setEvents((prev) => [
         ...prev,
         {
           id: res.schedule.id,
           audioId: item.id,
           title: item.title,
           duration: item.duration,
           roomId: pickerCell.roomId,
           day: pickerCell.day,
           time: pickerCell.time,
         },
       ]);
       setSongPickerOpen(false);
       setPickerCell(null);
     } catch (err: any) {
       const status = err?.response?.status;
       const body = err?.response?.data;
       if (status === 409 || body?.code === 'TIME_CONFLICT') {
         setError('This time slot is already taken!');
       } else {
         setError(body?.error || body?.detail || err?.message || 'Failed to create schedule');
       }
     }
   };

  const confirmDeleteEvent = async () => {
    if (!pendingDeleteEvent) return;
    try {
      await apiClient.deleteSchedule(pendingDeleteEvent.id);
      setEvents(prev => prev.filter(e => e.id !== pendingDeleteEvent.id));
      setPendingDeleteEvent(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to delete");
    }
  };

  const roomsToShow = selectedRoom === "all" ? rooms : rooms.filter(r => r.id === selectedRoom);

  if (isLoading) {
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
        <ScheduleToolbar query={query} onQueryChange={setQuery} selectedRoom={selectedRoom} onChangeRoom={setSelectedRoom as any} selectedDay={selectedDay} onChangeDay={setSelectedDay as any} rooms={rooms} days={weekDays} />

        <div className="flex-1 overflow-auto">
          {error && <div className="mx-4 my-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}

          {rooms.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="font-semibold text-gray-900">No players yet</h2>
                <p className="text-sm text-gray-500 mt-1">Create a player in the Players page to get started</p>
              </div>
            </div>
          ) : (
            <div>
              {roomsToShow.map(room => (
                <div key={room.id} className="border-b">
                  <div className="font-medium p-3 bg-gray-50 text-sm">{room.name}</div>
                  <div className="grid grid-cols-7">
                    {weekDays.map(day => {
                      const cellEvents = events.filter(e => e.roomId === room.id && e.day === day.short && e.title.toLowerCase().includes(query.toLowerCase()));
                      return (
                        <CalendarCell
                          key={`${room.id}-${day.short}`}
                          roomId={room.id}
                          day={day.short}
                          time="09:00"
                          events={cellEvents}
                          onDropEvent={handleDropEvent}
                          onDropPlaylist={() => {}}
                          onEventDelete={setPendingDeleteEvent}
                          compact={false}
                          onQuickCreate={(r, d, t) => {
                            setPickerCell({ roomId: r, day: d, time: t });
                            setSongPickerOpen(true);
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

        <ConfirmDialog open={!!pendingDeleteEvent} title="Remove from schedule?" description={pendingDeleteEvent ? `Remove "${pendingDeleteEvent.title}"?` : undefined} confirmLabel="Remove" cancelLabel="Keep" onCancel={() => setPendingDeleteEvent(null)} onConfirm={confirmDeleteEvent} />

        <SongPickerModal open={songPickerOpen} onClose={() => { setSongPickerOpen(false); setPickerCell(null); }} audio={audio} onSelect={handleSelectSong} />
      </div>
    </DndProvider>
  );
}
