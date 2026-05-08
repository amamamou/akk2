"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

export interface Broadcast {
	time: string;
	title: string;
	location: string;
	duration: string;
	status?: string;
}

export default function UpcomingBroadcasts({ broadcasts: fallbackBroadcasts }: Readonly<{ broadcasts: Broadcast[] }>) {
	const broadcasts = useMemo(() => fallbackBroadcasts, [fallbackBroadcasts]);
	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-gray-900">Coming Up</h2>
				<Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
					View All →
				</Link>
			</div>
			<div className="p-4 space-y-3">
				{broadcasts.map((broadcast) => (
					<div key={`${broadcast.time}-${broadcast.title}`} className="p-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
						<div className="flex items-start justify-between mb-2">
							<span className="text-2xl font-bold text-gray-900">{broadcast.time}</span>
							<span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
								{broadcast.duration}
							</span>
						</div>
						<h4 className="font-medium text-gray-900 mb-1">{broadcast.title}</h4>
						<p className="text-sm text-gray-500">{broadcast.location}</p>
					</div>
				))}
				{broadcasts.length === 0 && (
					<div className="p-8 text-center text-gray-400">
						<Calendar size={32} className="mx-auto mb-2 opacity-50" />
						<p className="text-sm">No upcoming broadcasts</p>
					</div>
				)}
			</div>
		</div>
	);
}
