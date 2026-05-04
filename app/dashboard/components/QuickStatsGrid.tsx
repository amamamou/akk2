import React from "react";
import { Calendar, Cast, Clock, Music2, Speaker } from "lucide-react";

export interface QuickStat {
	label: string;
	value: string;
	// icon may be a serializable string (from server mock data) or a React component
	icon: string | React.ElementType;
	trend: string;
}

export default function QuickStatsGrid({ stats }: { stats: QuickStat[] }) {
	const iconMap: Record<string, React.ElementType> = {
		Cast,
		Calendar,
		Clock,
		Music2,
		Speaker,
	};

	return (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
				{stats.map((stat, i) => (
					<div
						key={i}
						className="relative rounded-xl border border-gray-100 bg-white px-6 py-6 shadow-sm hover:shadow-xl transition-all"
					>
						{/* subtle top accent */}
						<div className="absolute top-0 left-0 right-0 h-0.5 rounded-tl-xl rounded-tr-xl bg-transparent" />

						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-4 min-w-0">
								<div className="flex flex-col items-start">
									<div className="inline-flex items-center justify-center text-[#A473FF]">
										{(() => {
											const Icon = typeof stat.icon === "string" ? iconMap[stat.icon] : stat.icon;
											if (!Icon) return null;
											return <Icon size={22} className="text-[#A473FF]" />;
										})()}
									</div>
									<span className="mt-3 text-xs font-medium text-gray-500 truncate">{stat.label}</span>
								</div>
							</div>

							<div className="flex flex-col items-end">
								<span className="text-3xl font-extrabold text-gray-900 leading-tight">{stat.value}</span>
								<span className="mt-2 inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">{stat.trend}</span>
							</div>
						</div>
					</div>
				))}
			</div>
	);
}
