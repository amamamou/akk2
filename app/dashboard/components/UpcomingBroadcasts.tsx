"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

export interface Broadcast {
	time: string;
	title: string;
	location: string;
	duration: string;
	status?: string;
}

const PLAYERS_STORAGE_KEY = "akou.players";
const SCHEDULE_STORAGE_KEY = "akou.scheduleEvents";

type StoredPlayer = {
	id?: string;
	roomId?: string;
	roomName?: string;
	playerName?: string;
};

type StoredScheduleEvent = {
	id: string;
	audioId: string;
	title: string;
	duration: number;
	roomId: string;
	day: string;
	time: string;
};

function getDayIndex(day: string): number {
	switch (day) {
		case "Mon":
			return 0;
		case "Tue":
			return 1;
		case "Wed":
			return 2;
		case "Thu":
			return 3;
		case "Fri":
			return 4;
		case "Sat":
			return 5;
		case "Sun":
			return 6;
		default:
			return 99;
	}
}

export default function UpcomingBroadcasts({ broadcasts: fallbackBroadcasts }: { broadcasts: Broadcast[] }) {
	const [realBroadcasts, setRealBroadcasts] = useState<Broadcast[]>([]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const loadFromStorage = () => {
			try {
				const rawPlayers = window.localStorage.getItem(PLAYERS_STORAGE_KEY);
				const rawEvents = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
				if (!rawEvents) {
					setRealBroadcasts([]);
					return;
				}

				const parsedEvents: unknown = JSON.parse(rawEvents);
				if (!Array.isArray(parsedEvents)) {
					setRealBroadcasts([]);
					return;
				}

				let playersById: Record<string, StoredPlayer> = {};
				if (rawPlayers) {
					const parsedPlayers: unknown = JSON.parse(rawPlayers);
					if (Array.isArray(parsedPlayers)) {
						playersById = (parsedPlayers as StoredPlayer[]).reduce(
							(map, p) => {
								const id = p.id ?? p.roomId;
								if (!id) return map;
								map[id] = p;
								return map;
							},
							{} as Record<string, StoredPlayer>,
						);
					}
				}

				const events = (parsedEvents as StoredScheduleEvent[]).slice();
				// Sort by day of week then time string; times are "fake" but ordered.
				events.sort((a, b) => {
					const da = getDayIndex(a.day);
					const db = getDayIndex(b.day);
					if (da !== db) return da - db;
					return a.time.localeCompare(b.time);
				});

				// Only show the first few upcoming events in the dashboard.
				const visible = events.slice(0, 4);
				// If all of them share exactly the same stored time (e.g. "09:00"),
				// generate a staggered display time so Coming Up feels more natural.
				const allSameTime =
					visible.length > 1 &&
					visible.every((e) => e.time === visible[0].time);
				let baseMinutes = 9 * 60; // fallback 09:00
				if (allSameTime) {
					const [hStr, mStr] = visible[0].time.split(":");
					const h = Number(hStr);
					const m = Number(mStr);
					if (!Number.isNaN(h) && !Number.isNaN(m)) {
						baseMinutes = h * 60 + m;
					}
				}

				const mapped: Broadcast[] = visible.map((evt, index) => {
					const player = playersById[evt.roomId];
					const location =
						player?.roomName ??
						player?.playerName ??
						player?.roomId ??
						"Unknown location";
					let displayTime = evt.time;
					if (allSameTime) {
						const minutes = baseMinutes + index * 60; // 1h slots
						const hh = Math.floor(minutes / 60) % 24;
						const mm = minutes % 60;
						displayTime = `${hh.toString().padStart(2, "0")}:${mm
							.toString()
							.padStart(2, "0")}`;
					}
					// Show day + time so entries don\'t all look identical even when
					// the underlying stored times are the same.
					const timeLabel = `${evt.day} ${displayTime}`;
					return {
						time: timeLabel,
						title: evt.title,
						location,
						duration: `${evt.duration}m`,
						status: "scheduled",
					};
				});

				setRealBroadcasts(mapped);
			} catch (err) {
				console.error("Failed to load upcoming broadcasts", err);
				setRealBroadcasts([]);
			}
		};

		loadFromStorage();

		// Update when schedule changes while dashboard is open.
		const handleScheduleUpdated = () => loadFromStorage();
		window.addEventListener("akou:schedule-updated", handleScheduleUpdated);
		return () => window.removeEventListener("akou:schedule-updated", handleScheduleUpdated);
	}, []);

	const broadcasts = useMemo(
		() => (realBroadcasts.length > 0 ? realBroadcasts : fallbackBroadcasts),
		[realBroadcasts, fallbackBroadcasts],
	);
	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-900">Coming Up</h2>
				<Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
					View All →
				</Link>
			</div>
			<div className="p-4 space-y-3">
				{broadcasts.map((broadcast, i) => (
					<div key={i} className="p-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
						<div className="flex items-start justify-between mb-2">
							<span className="text-2xl font-bold text-gray-900">{broadcast.time}</span>
							<span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
								{broadcast.duration}
							</span>
						</div>
						<h4 className="font-medium text-gray-900 mb-1">{broadcast.title}</h4>
						<p className="text-sm text-gray-500">{broadcast.location}</p>
					</div>
				))}
				{broadcasts.length === 0 && (
					<div className="p-8 text-center text-gray-400">
						<Calendar size={32} className="mx-auto mb-2 opacity-50" />
						<p className="text-sm">No upcoming broadcasts</p>
					</div>
				)}
			</div>
		</div>
	);
}
