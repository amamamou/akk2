"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Wifi, WifiOff, Cast } from "lucide-react";

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
			<div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
				<h2 className="text-base font-semibold text-gray-900">Live Player Status</h2>
				<Link href="/players" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
					View All →
				</Link>
			</div>
			<div className="p-4 space-y-3">
				{displayPlayers.length === 0 && (
					<p className="text-sm text-gray-500">
						No players yet. Create your first player from the Players page to see
							its live status here.
					</p>
				)}
				{displayPlayers.map((player, i) => (
					<div key={i} className="flex items-center gap-4 p-3 rounded-md hover:bg-gray-50 transition-colors">
						<div className="flex items-center gap-3 w-60 min-w-0">
							<div className="flex items-center justify-center h-8 w-8 rounded-md">
								<Cast size={16} className="text-[#A473FF]" />
							</div>
							<div className="min-w-0">
								<div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
								<div className="text-xs text-gray-400 truncate">{player.player}</div>
							</div>
						</div>

						<div className="flex-1">
							{/* compact inline progress */}
							<div className="flex items-center gap-3">
								<div className="flex-1">
									<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
										<div
											className="h-1.5 bg-[#A473FF]"
											style={{ width: `${Math.min(100, Math.max(0, (player.progress ?? 0) / ((player.duration && player.duration > 0 ? player.duration : 180)) * 100))}%` }}
										/>
									</div>
								</div>
								<div className="text-xs text-gray-400 w-20 text-right">
									{(() => {
										const d = player.duration && player.duration > 0 ? player.duration : 180;
										const s = Math.max(0, Math.floor(player.progress ?? 0));
										const m = Math.floor(s / 60);
										const ss = s % 60;
										const md = Math.floor(d / 60);
										const ssd = d % 60;
										return `${m}:${ss.toString().padStart(2, "0")} / ${md}:${ssd.toString().padStart(2, "0")}`;
									})()}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{player.status === "online" ? (
								<span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700" aria-label="Online">
									<Wifi size={12} className="text-emerald-600" aria-hidden />
								</span>
							) : (
								<span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600" aria-label="Offline">
									<WifiOff size={12} className="text-gray-500" aria-hidden />
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
