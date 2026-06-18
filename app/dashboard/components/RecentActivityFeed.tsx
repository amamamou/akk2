import React from "react";
import { PlayCircle, Speaker, Clock, Calendar } from "lucide-react";
import { cn } from "../../../utils/cn";

export interface ActivityItem {
	time: string;
	action: string;
	detail: string;
	type: string;
}

export default function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
	return (
<div
  className="
    bg-white
    dark:bg-zinc-900
    rounded-2xl
    border
    border-gray-100
    dark:border-zinc-800
    shadow-[0_8px_30px_rgba(0,0,0,0.04)]
    dark:shadow-none
    overflow-hidden
  "
>			
<div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800">				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
			</div>
<div className="divide-y divide-gray-50 dark:divide-zinc-800">
					{activities.map((activity, i) => (
					<div key={i} 
className="
  px-6
  py-5
  flex
  items-start
  gap-4
  hover:bg-[#FAFAFB]
  dark:hover:bg-zinc-800/50
  transition-all
">
							<div className={cn(
"h-10 w-10 rounded-xl flex items-center justify-center mt-0.5"	,					activity.type === "start" ? "bg-green-100 text-green-600" :
							activity.type === "connect" ? "bg-blue-100 text-blue-600" :
							activity.type === "complete" ? "bg-gray-100 text-gray-600" :
							"bg-purple-100 text-purple-600"
						)}>
							{activity.type === "start" && <PlayCircle size={16} />}
							{activity.type === "connect" && <Speaker size={16} />}
							{activity.type === "complete" && <Clock size={16} />}
							{activity.type === "update" && <Calendar size={16} />}
						</div>
						<div className="flex-1 min-w-0">
<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{activity.action}</p>
							<p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{activity.detail}</p>
						</div>
						<span className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{activity.time}</span>
					</div>
				))}
			</div>
		</div>
	);
}
