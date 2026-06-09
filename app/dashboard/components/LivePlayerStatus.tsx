"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Wifi, WifiOff, Play, Pause } from "lucide-react";

export interface PlayerStatus {
	name: string;
	player: string;
	status: "online" | "offline" | string;
	current: string;
	progress: number;
	duration?: number;
	/** Optional per-player stream/loop source; falls back to a bundled demo loop. */
	playlistUrl?: string;
}

function formatClock(totalSeconds: number): string {
	const s = Math.max(0, Math.floor(totalSeconds));
	const m = Math.floor(s / 60);
	const ss = s % 60;
	return `${m}:${ss.toString().padStart(2, "0")}`;
}

function PlayerStatusRow({ player }: Readonly<{ player: PlayerStatus }>) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState<number>(() =>
		Math.max(0, Math.floor(player.progress ?? 0))
	);

	const duration = player.duration && player.duration > 0 ? player.duration : 180;

	// Local simulation timer: the API does not stream real-time playingProgress, so while a
	// row is "playing" we advance the bar locally (wrapping at duration) so it animates
	// vividly instead of staying dead/empty at 0.
	useEffect(() => {
		if (!isPlaying) return;
		const id = window.setInterval(() => {
			setProgress((prev) => (prev + 1) % (duration + 1));
		}, 1000);
		return () => window.clearInterval(id);
	}, [isPlaying, duration]);

	const togglePlay = () => {
		const el = audioRef.current;
		setIsPlaying((prev) => {
			const next = !prev;
			// Drive the native HTML5 element when present. Missing/blocked demo assets reject
			// play() — we swallow that so the local simulation timer still runs.
			if (el) {
				if (next) {
					void el.play().catch(() => {});
				} else {
					el.pause();
				}
			}
			return next;
		});
	};

	const pct = Math.min(100, Math.max(0, (progress / duration) * 100));

	return (
		<div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAFAFB] hover:bg-[#F6F6F8] transition-all">
			<audio
				ref={audioRef}
				src={player.playlistUrl || "/audio/demo-loop.mp3"}
				loop
				preload="none"
			/>
			<div className="flex items-center gap-3 w-60 min-w-0">
				<button
					type="button"
					onClick={togglePlay}
					aria-label={isPlaying ? `Pause ${player.name}` : `Play ${player.name}`}
					className="flex items-center justify-center h-10 w-10 rounded-xl bg-white hover:bg-[#F3EEFF] transition-colors"
				>
					{isPlaying ? (
						<Pause size={16} className="text-[#A473FF]" />
					) : (
						<Play size={16} className="text-[#A473FF]" />
					)}
				</button>
				<div className="min-w-0">
					<div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
					<div className="text-xs text-gray-400 truncate">{player.player}</div>
				</div>
			</div>

			<div className="flex-1">
				<div className="flex items-center gap-3">
					<div className="flex-1">
						<div className="h-1.5 bg-[#ECECEF] rounded-full overflow-hidden">
							<div
								className="h-1.5 bg-[#A473FF] transition-[width] duration-500"
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
					<div className="text-xs text-gray-400 w-20 text-right">
						{formatClock(progress)} / {formatClock(duration)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{player.status === "online" ? (
					<span
						className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700"
						aria-label="Online"
					>
						<Wifi size={12} className="text-emerald-600" aria-hidden />
					</span>
				) : (
					<span
						className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-500"
						aria-label="Offline"
					>
						<WifiOff size={12} className="text-gray-500" aria-hidden />
					</span>
				)}
			</div>
		</div>
	);
}

export default function LivePlayerStatus({ players }: Readonly<{ players: PlayerStatus[] }>) {
	return (
		<div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-900">Live Player Status</h2>
				<Link
					href="/players"
					className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
				>
					View All →
				</Link>
			</div>
			<div className="p-6 space-y-3">
				{players.map((player, idx) => (
					<PlayerStatusRow
						key={`${player.player ?? ""}-${player.name ?? ""}-${idx}`}
						player={player}
					/>
				))}
			</div>
		</div>
	);
}
