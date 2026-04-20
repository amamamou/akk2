import React from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import QuickStatsGrid, { QuickStat } from "./QuickStatsGrid";

export default function DashboardHeader({ stats }: { stats: QuickStat[] }) {
	return (
		<div className=" top-0 z-10 bg-white border-b border-gray-200">
			<div className="px-8 py-6">
				<div className="flex items-start justify-between gap-4 mb-5">
					<div className="flex flex-col gap-1 min-w-0">
						<h1 className="text-2xl font-semibold text-gray-900">
							Dashboard
						</h1>
						<p className="text-sm text-gray-500 max-w-xl">
							Monitor venues, players, and scheduled broadcasts in one place.
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<Link
								aria-label="Open schedule"
								href="/schedule"
								className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
						>
							<CalendarDays size={14} className="text-gray-500" />
							<span>View schedule</span>
						</Link>
					</div>
				</div>

				<QuickStatsGrid stats={stats} />
			</div>
		</div>
	);
}
