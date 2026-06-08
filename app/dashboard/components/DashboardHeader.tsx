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
		<div className="sticky top-20 z-10 bg-white border-b border-[#e5e5e5]">
			<div className="px-8 py-8">
				{/* Title + actions */}
				<div className="flex items-center justify-between gap-6 mb-8">
					<div className="flex flex-col gap-2 min-w-0 flex-1">
						<h1 className="text-4xl font-bold text-[#1a1a1a] leading-tight tracking-tight">
							Good morning, {displayName}
						</h1>
						<p className="text-base text-[#666666] max-w-2xl">
							Monitor venues, players, and broadcasts at a glance.
						</p>
					</div>

					{/* Actions: search + schedule link */}
					<div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
						<div className="hidden sm:block">
							<SearchBox />
						</div>

						<Link
							aria-label="Open schedule"
							href="/schedule"
							className="
								inline-flex items-center justify-center gap-2 h-11 px-5
								bg-[#A473FF] text-white font-semibold text-sm rounded-lg
								transition-all duration-200
								hover:shadow-lg hover:opacity-92
								active:opacity-85
							"
						>
							<CalendarDays size={18} strokeWidth={1.5} />
							<span>View Schedule</span>
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
			<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]">
				<Search size={18} strokeWidth={1.5} />
			</div>

			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				aria-label="Search dashboard"
				placeholder="Search venues, players..."
				className="
					w-72 h-11 pl-11 pr-10
					bg-white rounded-lg
					border border-[#e5e5e5]
					text-sm text-[#1a1a1a]
					placeholder:text-[#999999]
					transition-all duration-200
					focus:outline-none focus:border-[#A473FF] focus:ring-2 focus:ring-[#A473FF]/10
					hover:border-[#d0d0d0]
				"
			/>

			{q ? (
				<button
					aria-label="Clear search"
					onClick={() => setQ("")}
					className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#1a1a1a] transition-colors"
				>
					<X size={16} strokeWidth={2} />
				</button>
			) : null}
		</div>
	);
}
