"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

type StoredUser = {
	name?: string;
	email?: string;
};
import Link from "next/link";
import { CalendarDays, Search, X } from "lucide-react";
import QuickStatsGrid, { QuickStat } from "./QuickStatsGrid";

export default function DashboardHeader({ stats, showStats = true }: { stats: QuickStat[]; showStats?: boolean }) {
	const { user } = useAuth();

	const u = user as StoredUser | undefined;
	const displayName = u?.name || u?.email || "there";

	return (
		<div className="mt-6 top-0 z-10 ">
			<div className="px-4 py-6">
				{/* Top row: Title + actions */}
				<div className="flex items-center justify-between gap-4 mb-5">
					<div className="flex items-start gap-4 min-w-0">
						<div className="flex flex-col gap-1 min-w-0">
							<h1 className="text-3xl font-semibold text-gray-900 leading-tight">
								{`Good morning, ${displayName} 👋`}
							</h1>
							<p className="text-sm text-gray-500 max-w-xl">
								Monitor venues, players, and scheduled broadcasts in one place.
							</p>
						</div>
					
					</div>

					{/* Actions: search, schedule link, primary */}
					<div className="flex items-center gap-3 shrink-0">
						{/* compact search */}
						<div className="hidden sm:block">
							<SearchBox />
						</div>

				<Link
	aria-label="Open schedule"
	href="/schedule"
	className="
	inline-flex
	items-center
	gap-3
	h-12
	px-5
	bg-white
	text-gray-900
	font-medium
	text-sm
	rounded-2xl
	border
	border-gray-100
	shadow-[0_8px_30px_rgba(0,0,0,0.04)]
	transition-all
	"
>
	<span className="inline-flex items-center justify-center">
		<CalendarDays
			size={16}
			strokeWidth={1.9}
			className="text-zinc-500"
		/>
	</span>

	<span>View schedule</span>
</Link>
					</div>
				</div>

				{/* Stats grid */}
				{showStats ? <QuickStatsGrid stats={stats} /> : null}
			</div>
		</div>
	);
}

function SearchBox() {
	const [q, setQ] = useState("");

	return (
		<div className="relative">
			<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
				<Search size={16} strokeWidth={1.9} />
			</div>

			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				aria-label="Search dashboard"
				placeholder="Search venues, players..."
				className="
					w-72
					h-12
					pl-11
					pr-10
					bg-white
					rounded-2xl
					border
					border-gray-100
					shadow-[0_8px_30px_rgba(0,0,0,0.04)]
					text-sm
					text-gray-700
					placeholder:text-gray-400
					focus:outline-none
					focus:ring-2
					focus:ring-[#A473FF]/20
				"
			/>

			{q ? (
				<button
					aria-label="Clear search"
					onClick={() => setQ("")}
					className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				>
					<X size={14} />
				</button>
			) : null}
		</div>
	);
}