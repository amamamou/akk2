"use client";

import React from "react";
import Link from "next/link";
import { Wifi, WifiOff, Cast } from "lucide-react";

export interface PlayerStatus {
	name: string;
	player: string;
	status: "online" | "offline" | string;
	current: string;
	progress: number;
	duration?: number;
}

export default function LivePlayerStatus({ players }: Readonly<{ players: PlayerStatus[] }>) {
	return (
<div
  className="
    bg-white
    rounded-2xl
    border
    border-gray-100
    shadow-[0_8px_30px_rgba(0,0,0,0.04)]
    overflow-hidden
  "
>			
<div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
<h2 className="text-lg font-semibold text-gray-900">Live Player Status</h2>
<Link
  href="/players"
  className="
    text-sm
    font-medium
    text-gray-500
    hover:text-gray-900
    transition-colors
  "
>					View All →
				</Link>
			</div>
			<div className="p-6 space-y-3">
				{players.map((player, idx) => (
					<div key={`${player.player ?? ""}-${player.name ?? ""}-${idx}`} className="flex items-center gap-4 p-4 rounded-xl bg-[#FAFAFB] hover:bg-[#F6F6F8] transition-all">
						<div className="flex items-center gap-3 w-60 min-w-0">
							<div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white">
								<Cast size={16} className="text-[#A473FF]" />
							</div>
							<div className="min-w-0">
								<div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
								<div className="text-xs text-gray-400 truncate">{player.player}</div>
							</div>
						</div>

						<div className="flex-1">
							<div className="flex items-center gap-3">
								<div className="flex-1">
									<div className="h-1.5 bg-[#ECECEF] rounded-full overflow-hidden">
										<div className="h-1.5 bg-[#A473FF]" style={{ width: `${Math.min(100, Math.max(0, (player.progress ?? 0) / ((player.duration && player.duration > 0 ? player.duration : 180)) * 100))}%` }} />
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
								<span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700" aria-label="Online">
									<Wifi size={12} className="text-emerald-600" aria-hidden />
								</span>
							) : (
								<span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-500" aria-label="Offline">
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
