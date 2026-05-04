import React from "react";
import Link from "next/link";
import { Calendar, Music2, Activity } from "lucide-react";

export default function QuickActions() {
	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
			<div className="grid grid-cols-1 gap-3">
				<Link
					href="/schedule"
					className="group flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:shadow-md transition-transform hover:-translate-y-0.5"
				>
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-50 group-hover:bg-[#A473FF] transition-colors">
						<Calendar size={18} className="text-gray-700 group-hover:text-white" />
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-medium text-gray-900 truncate">Create Broadcast</span>
						<span className="text-xs text-gray-500 truncate">Schedule a new broadcast</span>
					</div>
				</Link>
				<Link
					href="/library"
					className="group flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:shadow-md transition-transform hover:-translate-y-0.5"
				>
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-50 group-hover:bg-[#A473FF] transition-colors">
						<Music2 size={18} className="text-gray-700 group-hover:text-white" />
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-medium text-gray-900 truncate">Upload Audio</span>
						<span className="text-xs text-gray-500 truncate">Add tracks to your library</span>
					</div>
				</Link>
				<Link
					href="/analytics"
					className="group flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:shadow-md transition-transform hover:-translate-y-0.5"
				>
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-50 group-hover:bg-[#A473FF] transition-colors">
						<Activity size={18} className="text-gray-700 group-hover:text-white" />
					</div>
					<div className="flex flex-col min-w-0">
						<span className="text-sm font-medium text-gray-900 truncate">View Analytics</span>
						<span className="text-xs text-gray-500 truncate">Open analytics dashboard</span>
					</div>
				</Link>
			</div>
		</div>
	);
}
