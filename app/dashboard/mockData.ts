import { Calendar, Speaker, Clock, Music2 } from "lucide-react";

export const upcomingBroadcasts = [
	{ time: "14:00", title: "Deep Focus", location: "Yoga Studio", duration: "120m", status: "scheduled" },
	{ time: "15:00", title: "Lobby Ambience", location: "Lobby", duration: "180m", status: "scheduled" },
	{ time: "16:00", title: "Evening Rest", location: "Therapy Room A", duration: "60m", status: "scheduled" },
];

export const recentActivity = [
	{ time: "2m ago", action: "Broadcast started", detail: "Morning Flow in Yoga Studio", type: "start" },
	{ time: "15m ago", action: "Player connected", detail: "Player 04 - Retail Floor", type: "connect" },
	{ time: "1h ago", action: "Broadcast completed", detail: "Lobby Ambience Loop in Lobby", type: "complete" },
	{ time: "2h ago", action: "Schedule updated", detail: "Added 3 new broadcasts for tomorrow", type: "update" },
];

export const quickStats = [
	{ label: "Active players", value: "3 / 4", icon: Speaker, trend: "+1 today" },
	{ label: "Today’s broadcasts", value: "12", icon: Calendar, trend: "6 done" },
	{ label: "Listening time", value: "8.5 h", icon: Clock, trend: "+2.3 h vs yesterday" },
	{ label: "Library items", value: "24", icon: Music2, trend: "+2 this week" },
];

export const playerStatus = [
	{ name: "Yoga Studio", player: "Player 01", status: "online", current: "Morning Flow", progress: 65 },
	{ name: "Lobby", player: "Player 02", status: "online", current: "Lobby Ambience", progress: 42 },
	{ name: "Therapy Room A", player: "Player 03", status: "offline", current: "None", progress: 0 },
	{ name: "Retail Floor", player: "Player 04", status: "online", current: "Upbeat Playlist", progress: 88 },
];

const data = { upcomingBroadcasts, recentActivity, quickStats, playerStatus };

export default data;
