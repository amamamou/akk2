"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Wifi, WifiOff } from "lucide-react";
import NowPlaying from "../../players/components/NowPlaying";

const PLAYERS_STORAGE_KEY = "akou.players";

type StoredTrack = {
	title?: string;
	duration?: number;
};

type StoredPlayer = {
	id?: string;
	roomName?: string;
	playerName?: string;
	status?: string;
	playlist?: StoredTrack[];
	playlistIndex?: number;
	nowPlaying?: StoredTrack | null;
	playingProgress?: number;
	isPlaying?: boolean;
};

export interface PlayerStatus {
	name: string;
	player: string;
	status: "online" | "offline" | string;
	current: string;
	progress: number;
	duration?: number;
}

export default function LivePlayerStatus({ players }: { players: PlayerStatus[] }) {
	const [livePlayers, setLivePlayers] = useState<PlayerStatus[]>([]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const mapFromStorage = (raw: string | null): PlayerStatus[] => {
			if (!raw) return [];
			try {
				const parsed: unknown = JSON.parse(raw);
				if (!Array.isArray(parsed)) return [];

				const stored = parsed as StoredPlayer[];
				return stored.map((p, index): PlayerStatus => {
					const name =
						p.roomName?.trim() ||
						p.playerName?.trim() ||
						`Player ${index + 1}`;

					const playerLabel =
						p.playerName?.trim() ||
						p.roomName?.trim() ||
						(p.id ? `ID ${p.id}` : `Player ${index + 1}`);

					const playlist = p.playlist ?? [];
					const idx = p.playlistIndex ?? 0;
					const fromPlaylist = playlist[idx] ?? playlist[0];
					const fromNowPlaying = p.nowPlaying ?? undefined;
					const currentTrack: StoredTrack | undefined =
						fromNowPlaying && fromNowPlaying.title
							? fromNowPlaying
							: fromPlaylist;

					const currentTitle = currentTrack?.title ?? "Idle";
					const duration =
						currentTrack?.duration && currentTrack.duration > 0
							? currentTrack.duration
							: 180; // default to 3 minutes if unknown
					const progress =
						typeof p.playingProgress === "number" ? p.playingProgress : 0;
					const isOnline =
						p.status === "online" ||
						p.isPlaying === true ||
						(playlist?.length ?? 0) > 0;

					return {
						name,
						player: playerLabel,
						status: isOnline ? "online" : "offline",
						current: currentTitle,
						progress,
						duration,
					};
				});
			} catch {
				return [];
			}
		};

		const load = () => {
			const raw = window.localStorage.getItem(PLAYERS_STORAGE_KEY);
			const mapped = mapFromStorage(raw);
			setLivePlayers(mapped);
		};

		load();

		const handlePlayersUpdated = () => {
			load();
		};

		window.addEventListener(
			"akou:players-updated",
			handlePlayersUpdated as EventListener,
		);
		return () => {
			window.removeEventListener(
				"akou:players-updated",
				handlePlayersUpdated as EventListener,
			);
		};
	}, []);

	// Locally simulate playback progress so the waveform and time behave
	// just like on the Players page, even though we only read from
	// persisted player data.
	useEffect(() => {
		const interval = setInterval(() => {
			setLivePlayers((prev) =>
				prev.map((p) => {
					// Only animate players that look online and have a track
					if (p.status !== "online" || !p.current) return p;
					const duration = p.duration && p.duration > 0 ? p.duration : 180;
					const nextProgress = (p.progress ?? 0) + 1;
					if (nextProgress > duration) {
						// Loop the same track rather than advancing playlist –
						// this keeps the UI simple while still feeling alive.
						return { ...p, progress: 0 };
					}
					return { ...p, progress: nextProgress };
				}),
			);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const displayPlayers = livePlayers.length > 0 ? livePlayers : players;

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Activity size={18} className="text-gray-700" />
					<h2 className="text-lg font-semibold text-gray-900">Live Player Status</h2>
				</div>
				<Link href="/players" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
					View All →
				</Link>
			</div>
			<div className="p-6 space-y-4">
				{displayPlayers.length === 0 && (
					<p className="text-sm text-gray-500">
						No players yet. Create your first player from the Players page to see
							its live status here.
					</p>
				)}
				{displayPlayers.map((player, i) => (
					<div
						key={i}
						className="flex items-center gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
					>
						<div className="flex-1">
							<div className="flex items-center justify-between mb-2">
								<div>
									<h4 className="font-medium text-gray-900">{player.name}</h4>
									<p className="text-xs text-gray-500">{player.player}</p>
								</div>
								<div className="flex items-center gap-3">
									{player.status === "online" ? (
										<span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700" aria-label="Online">
											<Wifi size={12} className="text-emerald-600" aria-hidden />
											<span>Online</span>
										</span>
									) : (
										<span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600" aria-label="Offline">
											<WifiOff size={12} className="text-gray-500" aria-hidden />
											<span>Offline</span>
										</span>
									)}
								</div>
							</div>
							<NowPlaying
									evt={
										player.status === "online" && player.current
											? {
													id: String(i),
													title: player.current,
													duration:
														player.duration && player.duration > 0
															? player.duration
															: 180,
											}
										: null
									}
									playingProgress={player.progress ?? 0}
									playlistLength={0}
									onEmptyClick={() => {}}
									isPlaying={player.status === "online"}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
