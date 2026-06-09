import React from "react";
import { Calendar, Cast, Clock, Music2, Speaker, Activity, Building } from "lucide-react";

export interface QuickStat {
	label: string;
	value: string;
	// icon may be a serializable string (from server mock data) or a React component
	icon: string | React.ElementType;
	// raw trend string (e.g. "+12% this month")
	trend: string;
	// contextual metric under the value (e.g. "Active devices")
	context?: string;
	// footer / status line (e.g. "18 live now")
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
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
			{stats.map((stat, i) => {
				const Icon = typeof stat.icon === "string" ? iconMap[stat.icon] : stat.icon;
				const isFirst = i === 0;

				// Attempt to parse trend into delta + label (e.g. "+12% this month")
				const [delta, ...labelParts] = stat.trend ? stat.trend.split(" ") : ["", ""];
				const labelText = labelParts.join(" ");

				return (
					<div
						key={i}
						className={
							`relative overflow-hidden rounded-2xl px-6 py-6 flex flex-col transition-all h-[200px] ` +
							(isFirst
								? `bg-[linear-gradient(135deg,#111827_0%,#A473FF_100%)] text-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]`
								: `bg-white border border-gray-100 text-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.04)]`)
						}
					>

						{/* header: label left, tiny icon right */}
						<div className="flex items-center justify-between">
							<span className={isFirst ? "text-sm font-medium text-white/80" : "text-sm font-medium text-zinc-500"}>{stat.label}</span>
							{Icon && <Icon size={18} strokeWidth={1.9} className={isFirst ? "text-white/70" : "text-zinc-400"} />}
						</div>

						{/* value */}
						<div className={isFirst ? "mt-4 text-4xl font-semibold text-white tracking-tight" : "mt-4 text-4xl font-semibold text-zinc-900 tracking-tight"}>{stat.value}</div>

						{/* trend (contextual) */}
						<div className="mt-3">
							<div className={isFirst ? "text-sm text-emerald-200" : "text-sm text-emerald-600"}>{delta}</div>
							<div className={isFirst ? "text-xs text-white/60" : "text-xs text-zinc-400"}>{labelText}</div>
						</div>

						{/* divider + footer (visible) - structured footer + status */}
						<div className={isFirst ? "mt-auto pt-4 border-t border-white/15" : "mt-auto pt-4 border-t border-gray-100"}>
							<div className="flex items-center justify-between">
								<div>
									<div className="flex items-center gap-2">
										<span className={isFirst ? "h-2 w-2 rounded-full bg-emerald-300/80" : "h-2 w-2 rounded-full bg-emerald-600/40"} />
										<span className={isFirst ? "text-xs text-white/60" : "text-xs text-zinc-400"}>{stat.footer || "18 live now"}</span>
									</div>

									{stat.context && <div className={isFirst ? "text-xs text-white/60 mt-1" : "text-xs text-zinc-400 mt-1"}>{stat.context}</div>}
								</div>

								{isFirst && <span className="text-xs font-medium rounded-full bg-white/20 px-2 py-0.5">Live</span>}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
