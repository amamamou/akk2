import React from "react";
import Link from "next/link";
import { CalendarDays, Library, BarChart3 } from "lucide-react";

export default function QuickActions() {
	return (
		<div
			className="
				bg-white
				rounded-2xl
				border
				border-gray-100
				shadow-[0_8px_30px_rgba(0,0,0,0.04)]
				p-6
			"
		>
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
			<div className="grid grid-cols-1 gap-3">
				<Link
					href="/schedule"
					className="
						group
						flex
						items-center
						gap-4
						p-4
						rounded-xl
						bg-[#FAFAFB]
						hover:bg-[#F6F6F8]
						transition-all
					"
				>
					<div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white group-hover:bg-[#A473FF] transition-all">
						<CalendarDays size={18} strokeWidth={1.9} className="text-zinc-500 group-hover:text-white" />
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-semibold text-gray-900 truncate">Create Broadcast</span>
						<span className="text-xs text-gray-500 truncate">Schedule a new broadcast</span>
					</div>
				</Link>
				<Link
					href="/library"
					className="
						group
						flex
						items-center
						gap-4
						p-4
						rounded-xl
						bg-[#FAFAFB]
						hover:bg-[#F6F6F8]
						transition-all
					"
				>
					<div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white group-hover:bg-[#A473FF] transition-all">
						<Library size={18} strokeWidth={1.9} className="text-zinc-500 group-hover:text-white" />
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-semibold text-gray-900 truncate">Upload Audio</span>
						<span className="text-xs text-gray-500 truncate">Add tracks to your library</span>
					</div>
				</Link>
				<Link
					href="/analytics"
					className="
						group
						flex
						items-center
						gap-4
						p-4
						rounded-xl
						bg-[#FAFAFB]
						hover:bg-[#F6F6F8]
						transition-all
					"
				>
					<div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white group-hover:bg-[#A473FF] transition-all">
						<BarChart3 size={18} strokeWidth={1.9} className="text-zinc-500 group-hover:text-white" />
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-semibold text-gray-900 truncate">View Analytics</span>
						<span className="text-xs text-gray-500 truncate">Open analytics dashboard</span>
					</div>
				</Link>
			</div>
		</div>
	);
}
