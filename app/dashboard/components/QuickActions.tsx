import React from "react";
import Link from "next/link";
import { Calendar, Music2, Activity } from "lucide-react";

export default function QuickActions() {
	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
			<div className="space-y-2">
				<Link 
					href="/"
					className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
				>
					<div className="p-2 bg-white border border-gray-200 rounded-lg group-hover:border-gray-300">
						<Calendar size={18} className="text-gray-700" />
					</div>
					<span className="text-sm font-medium text-gray-900">Create Broadcast</span>
				</Link>
				<Link 
					href="/library"
					className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
				>
					<div className="p-2 bg-white border border-gray-200 rounded-lg group-hover:border-gray-300">
						<Music2 size={18} className="text-gray-700" />
					</div>
					<span className="text-sm font-medium text-gray-900">Upload Audio</span>
				</Link>
				<Link 
					href="/analytics"
					className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
				>
					<div className="p-2 bg-white border border-gray-200 rounded-lg group-hover:border-gray-300">
						<Activity size={18} className="text-gray-700" />
					</div>
					<span className="text-sm font-medium text-gray-900">View Analytics</span>
				</Link>
			</div>
		</div>
	);
}
