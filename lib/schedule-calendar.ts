export type ScheduleViewMode = "week" | "month" | "hour";

export const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const HOUR_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
] as const;

export type DayColumn = { short: string; full: string; date: string };

export function buildWeekDays(anchor = new Date()): DayColumn[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullLabels = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  ];
  const start = new Date(anchor);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return labels.map((short, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      short,
      full: fullLabels[i],
      date: d.toISOString().slice(0, 10),
    };
  });
}

export type MonthCell = { date: string; day: number | null; inMonth: boolean };

export function buildMonthGrid(anchor = new Date()): MonthCell[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ date: "", day: null, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, month, d).toISOString().slice(0, 10);
    cells.push({ date: iso, day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: "", day: null, inMonth: false });
  }

  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function shortDayFromDate(date: Date): string {
  return SHORT_DAYS[date.getDay()] || "Mon";
}

export function buildDateForDayAndTime(day: string, time: string, anchor = new Date()) {
  const [hours, minutes] = time.split(":").map(Number);
  const dayIndex = SHORT_DAYS.indexOf(day as (typeof SHORT_DAYS)[number]);
  const date = new Date(anchor);
  const current = date.getDay();
  const diff = dayIndex === -1 ? 0 : (dayIndex - current + 7) % 7;
  date.setDate(date.getDate() + diff);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export function buildDateForIsoAndTime(isoDate: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(`${isoDate}T00:00:00`);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export function eventMatchesHour(time: string, slot: string): boolean {
  const [eh] = time.split(":").map(Number);
  const [sh] = slot.split(":").map(Number);
  return eh === sh;
}