import React from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface QuickStat {
	label: string;
	value: string;
	icon: React.ElementType;
	trend: string;
}

export default function QuickStatsGrid({ stats }: { stats: QuickStat[] }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
			{stats.map((stat, i) => (
				<div
						key={i}
						className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-3 shadow-sm hover:border-gray-300 transition-colors"
				>
					<div className="flex items-center justify-between gap-2 mb-2">
						<div className="flex items-center gap-2.5 min-w-0">
							<div
								className={cn(
									"inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500",
								)}
							>
								<stat.icon size={16} className="text-gray-600" />
							</div>
							<span className="text-xs font-medium text-gray-500 truncate">
								{stat.label}
							</span>
						</div>
						<span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
							<TrendingUp size={11} className="text-gray-400" />
							{stat.trend}
						</span>
					</div>
					<div className="text-xl font-semibold text-gray-900 leading-tight">
						{stat.value}
					</div>
				</div>
			))}
		</div>
	);
}
