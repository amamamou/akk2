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
			<div
				className="
					bg-white
					rounded-2xl
					border
					border-gray-100
					shadow-[0_8px_30px_rgba(0,0,0,0.04)]
					overflow-hidden
				"
			>
				<div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900">Coming Up</h2>
					<Link
						href="/"
						className="
							text-sm
							font-medium
							text-gray-500
							hover:text-gray-900
							transition-colors
						"
					>
						View All →
					</Link>
				</div>
				<div className="p-6 space-y-3">
				{broadcasts.map((broadcast) => (
					<div key={`${broadcast.time}-${broadcast.title}`} className="
	  p-5
	  bg-[#FAFAFB]
	  rounded-xl
	  hover:bg-[#F6F6F8]
	  transition-all
	">
							<div className="flex items-start justify-between mb-2">
								<span className="text-2xl font-semibold text-gray-900">{broadcast.time}</span>
								<span className="text-xs bg-white text-gray-600 px-3 py-1 rounded-full font-medium">
									{broadcast.duration}
								</span>
							</div>
							<h4 className="font-semibold text-gray-900 mb-1">{broadcast.title}</h4>
							<p className="text-sm text-gray-500">{broadcast.location}</p>
						</div>
				))}
				{broadcasts.length === 0 && (
					<div className="p-10 text-center">
						<Calendar size={32} className="mx-auto mb-3 text-gray-300" />
						<p className="text-sm text-gray-500">No upcoming broadcasts</p>
					</div>
				)}
			</div>
		</div>
	);
}
