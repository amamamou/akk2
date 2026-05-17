"use client";

import React, { useEffect, useState } from "react";
import { getApiClient } from "@/lib/api-client";
import type { ClientInfo } from "@/types/api";
import {
	Building,
	Mail,
	Phone,
	CheckCircle,
	AlertCircle,
	Clock,
	ChevronRight,
	Search,
	X,
} from "lucide-react";

export default function ClientsClient() {
	const apiClient = getApiClient();
	const [clients, setClients] = useState<ClientInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");

	useEffect(() => {
		let cancelled = false;

		const loadClients = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const response = await apiClient.listClients();
				if (cancelled) return;

				if (response.ok && response.clients) {
					setClients(response.clients);
				} else {
					setError("Failed to load clients");
				}
			} catch (err: any) {
				if (!cancelled) {
					const message =
						err?.response?.data?.error ||
						err?.message ||
						"Failed to load clients";
					setError(message);
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		};

		loadClients();

		return () => {
			cancelled = true;
		};
	}, [apiClient]);

	const filteredClients = clients.filter((client) => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return true;

		const searchFields = [
			client.name,
			client.businessType,
			client.contactPerson,
			client.email,
			client.phone,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return searchFields.includes(normalizedQuery);
	});



	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="text-sm text-gray-600">Loading clients…</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col overflow-hidden bg-white">
			{/* Header */}
			<div className="flex-shrink-0 border-b border-gray-200">
				<div className="px-8 py-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
							<p className="text-sm text-gray-500 mt-1">
								Manage and monitor all your client accounts.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto">
				<div className="px-8 py-6">
					{/* Search Bar */}
					<div className="mb-6">
						<div className="relative">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
							/>
							<input
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search by name, business type, contact..."
								className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30 focus:border-transparent"
							/>
							{query && (
								<button
									onClick={() => setQuery("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									<X size={16} />
								</button>
							)}
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
							{error}
						</div>
					)}

					{/* Clients List */}
					{filteredClients.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<div className="text-center space-y-2">
								<h2 className="text-sm font-semibold text-gray-900">
									{query ? "No clients match" : "No clients yet"}
								</h2>
								<p className="text-xs text-gray-500 max-w-sm">
									{query
										? "Try adjusting your search query to find the client you're looking for."
										: "Start managing clients from the admin panel."}
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							{filteredClients.map((client) => (
								<ClientRow key={client.id} client={client} />
							))}
						</div>
					)}

					{/* Count */}
					{filteredClients.length > 0 && (
						<div className="mt-6 text-xs text-gray-500 text-center">
							Showing {filteredClients.length} of {clients.length} clients
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function ClientRow({ client }: { client: ClientInfo }) {
	const getStatusBadge = (status: string) => {
		const statusConfig: Record<
			string,
			{ bg: string; text: string; icon: React.ReactNode }
		> = {
			ACTIVE: {
				bg: "bg-green-50",
				text: "text-green-700",
				icon: <CheckCircle size={16} />,
			},
			INACTIVE: {
				bg: "bg-gray-50",
				text: "text-gray-700",
				icon: <AlertCircle size={16} />,
			},
			TRIAL: {
				bg: "bg-blue-50",
				text: "text-blue-700",
				icon: <Clock size={16} />,
			},
		};

		const config = statusConfig[status] || statusConfig.INACTIVE;

		return (
			<div
				className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text} text-xs font-medium`}
			>
				{config.icon}
				{status}
			</div>
		);
	};

	const getSubscriptionColor = (tier: string) => {
		const colors: Record<string, string> = {
			STARTER: "text-blue-600 bg-blue-50",
			PROFESSIONAL: "text-purple-600 bg-purple-50",
			ENTERPRISE: "text-amber-600 bg-amber-50",
		};
		return colors[tier] || "text-gray-600 bg-gray-50";
	};

	return (
		<div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-4 flex-1">
					{/* Client Avatar/Icon */}
					<div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-[#A473FF] to-[#7C3AED] flex items-center justify-center">
						<Building size={20} className="text-white" />
					</div>

					{/* Client Info */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3 mb-2">
							<h3 className="text-sm font-semibold text-gray-900 truncate">
								{client.name}
							</h3>
							{getStatusBadge(client.status)}
						</div>

						<div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
							{/* Business Type */}
							{client.businessType && (
								<div className="flex items-center gap-2">
									<span className="text-gray-500">Business:</span>
									<span className="text-gray-900 font-medium">
										{client.businessType}
									</span>
								</div>
							)}

							{/* Contact Person */}
							{client.contactPerson && (
								<div className="flex items-center gap-2">
									<span className="text-gray-500">Contact:</span>
									<span className="text-gray-900 truncate">
										{client.contactPerson}
									</span>
								</div>
							)}

							{/* Email */}
							{client.email && (
								<div className="flex items-center gap-2">
									<Mail size={14} className="text-gray-500 flex-shrink-0" />
									<a
										href={`mailto:${client.email}`}
										className="text-blue-600 hover:underline truncate"
									>
										{client.email}
									</a>
								</div>
							)}

							{/* Phone */}
							{client.phone && (
								<div className="flex items-center gap-2">
									<Phone size={14} className="text-gray-500 flex-shrink-0" />
									<a
										href={`tel:${client.phone}`}
										className="text-blue-600 hover:underline"
									>
										{client.phone}
									</a>
								</div>
							)}
						</div>

						{/* Subscription & Limits */}
						<div className="flex items-center gap-4 text-xs">
							<div
								className={`px-2.5 py-1 rounded-md font-medium ${getSubscriptionColor(client.subscriptionTier)}`}
							>
								{client.subscriptionTier}
							</div>
							<div className="text-gray-600">
								<span className="font-medium text-gray-900">
									{client.maxPlayers}
								</span>{" "}
								players
							</div>
							<div className="text-gray-600">
								<span className="font-medium text-gray-900">
									{client.maxStorageGb}
								</span>{" "}
								GB storage
							</div>
						</div>
					</div>
				</div>

				{/* Action */}
				<div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 mt-1">
					<ChevronRight size={20} />
				</div>
			</div>
		</div>
	);
}

