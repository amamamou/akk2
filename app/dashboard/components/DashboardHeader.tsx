"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CalendarDays, Search, X } from "lucide-react";
import QuickStatsGrid, { QuickStat } from "./QuickStatsGrid";

export default function DashboardHeader({ stats }: { stats: QuickStat[] }) {
	return (
		<div className=" top-0 z-10 bg-white border-b border-gray-200">
			<div className="px-8 py-6">
				{/* Top row: Title + actions */}
				<div className="flex items-center justify-between gap-4 mb-5">
					<div className="flex items-start gap-4 min-w-0">
						<div className="flex flex-col gap-1 min-w-0">
							<h1 className="text-2xl font-semibold text-gray-900 leading-tight">
								Dashboard
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
							className="inline-flex items-center gap-2 rounded-md bg-[#A473FF] text-white px-4 py-2 text-sm font-semibold hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/40"
						>
							<span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-white/10">
								<CalendarDays size={14} className="text-white" />
							</span>
							<span>View schedule</span>
						</Link>
					</div>
				</div>

				{/* Stats grid */}
				<QuickStatsGrid stats={stats} />
			</div>
		</div>
	);
}

function SearchBox() {
	const [q, setQ] = useState("");

	return (
		<div className="relative">
			<div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
				<Search size={16} />
			</div>
			<input
				value={q}
				onChange={(e) => setQ(e.target.value)}
				aria-label="Search dashboard"
				placeholder="Search venues, players..."
				className="w-64 pl-9 pr-10 py-2 text-sm rounded-md bg-gray-50 border border-gray-100 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#A473FF]"
			/>
			{q ? (
				<button
					aria-label="Clear search"
					onClick={() => setQ("")}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				>
					<X size={14} />
				</button>
			) : null}
		</div>
	);
}
