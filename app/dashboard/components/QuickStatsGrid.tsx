import React from "react";
import { Calendar, Cast, Clock, Music2, Speaker, Activity, Building } from "lucide-react";

export interface QuickStat {
	label: string;
	value: string;
	icon: string | React.ElementType;
	trend: string;
	context?: string;
	footer?: string;
}

export default function QuickStatsGrid({ stats }: { stats: QuickStat[] }) {
	const iconMap: Record<string, React.ElementType> = {
		Cast,
		Calendar,
		Clock,
		Music2,
		Speaker,
		Activity,
		Building,
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
			{stats.map((stat, i) => {
				const Icon = typeof stat.icon === "string" ? iconMap[stat.icon] : stat.icon;
				const isFirst = i === 0;

				const [delta, ...labelParts] = stat.trend ? stat.trend.split(" ") : ["", ""];
				const labelText = labelParts.join(" ");

				return (
					<div
						key={i}
						className={`
							relative overflow-hidden rounded-lg border transition-all duration-200 p-6 flex flex-col
							${
								isFirst
									? "bg-gradient-to-br from-[#A473FF] to-[#8b58ff] text-white border-[#A473FF] shadow-lg hover:shadow-xl"
									: "bg-white border-[#e5e5e5] text-[#1a1a1a] hover:border-[#d0d0d0] hover:shadow-md"
							}
						`}
					>
						{/* Header: label left, icon right */}
						<div className="flex items-center justify-between mb-4">
							<span className={`text-sm font-medium ${isFirst ? "text-white/85" : "text-[#666666]"}`}>
								{stat.label}
							</span>
							{Icon && (
								<Icon 
									size={20} 
									strokeWidth={1.5} 
									className={isFirst ? "text-white/70" : "text-[#999999]"}
								/>
							)}
						</div>

						{/* Value */}
						<div className={`text-4xl font-bold tracking-tight mb-4 ${isFirst ? "text-white" : "text-[#1a1a1a]"}`}>
							{stat.value}
						</div>

						{/* Trend section */}
						<div className="mb-4">
							<div className={`text-sm font-semibold ${isFirst ? "text-emerald-200" : "text-emerald-600"}`}>
								{delta}
							</div>
							<div className={`text-xs ${isFirst ? "text-white/70" : "text-[#999999]"}`}>
								{labelText}
							</div>
						</div>

						{/* Divider + Footer */}
						<div className={`mt-auto pt-4 border-t ${isFirst ? "border-white/20" : "border-[#e5e5e5]"}`}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className={`h-2 w-2 rounded-full ${isFirst ? "bg-emerald-300" : "bg-emerald-600"}`} />
									<span className={`text-xs ${isFirst ? "text-white/70" : "text-[#999999]"}`}>
										{stat.footer || "Active now"}
									</span>
								</div>
								{isFirst && (
									<span className="text-xs font-semibold rounded-md bg-white/20 text-white px-2.5 py-1">Live</span>
								)}
							</div>
							{stat.context && (
								<div className={`text-xs mt-2 ${isFirst ? "text-white/70" : "text-[#999999]"}`}>
									{stat.context}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
