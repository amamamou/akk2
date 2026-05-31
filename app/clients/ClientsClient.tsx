"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getApiClient } from "@/lib/api-client";
import type {
	ClientBillingSummary,
	ClientCreateInput,
	ClientInfo,
	InvoiceInfo,
} from "@/types/api";
import IssueInvoiceModal from "./components/IssueInvoiceModal";
import { formatMoney } from "@/lib/format-currency";
import AdminAddModal from "@/app/admin/components/AdminAddModal";
import AdminToast from "@/app/admin/components/AdminToast";
import {
	Building2,
	ChevronRight,
	Mail,
	Phone,
	Search,
	Receipt,
	ShieldAlert,
	X,
} from "lucide-react";

const subscriptionTiers = ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;

type ClientFormState = {
	name: string;
	businessType: string;
	subscriptionTier: ClientCreateInput["subscriptionTier"];
	maxPlayers: string;
	maxStorageGb: string;
	contactPerson: string;
	email: string;
	phone: string;
};

const initialFormState: ClientFormState = {
	name: "",
	businessType: "",
	subscriptionTier: "STARTER",
	maxPlayers: "5",
	maxStorageGb: "2",
	contactPerson: "",
	email: "",
	phone: "",
};

const tierLocks: Record<Exclude<ClientFormState["subscriptionTier"], "ENTERPRISE">, { maxPlayers: number; maxStorageGb: number }> = {
	STARTER: { maxPlayers: 5, maxStorageGb: 2 },
	PROFESSIONAL: { maxPlayers: 20, maxStorageGb: 20 },
};

function normalizeBillingSummary(raw: Record<string, unknown>): ClientBillingSummary {
	return {
		clientId: String(raw.clientId ?? raw.client_id ?? ""),
		tenantId: (raw.tenantId ?? raw.tenant_id) as string | null | undefined,
		subscriptionTier: String(raw.subscriptionTier ?? raw.subscription_tier ?? "STARTER"),
		planName: (raw.planName ?? raw.plan_name) as string | null | undefined,
		maxPlayers: Number(raw.maxPlayers ?? raw.max_players ?? 0),
		maxStorageGb: Number(raw.maxStorageGb ?? raw.max_storage_gb ?? 0),
		totalInvoiced: Number(raw.totalInvoiced ?? raw.total_invoiced ?? 0),
		outstandingBalance: Number(raw.outstandingBalance ?? raw.outstanding_balance ?? 0),
		paidTotal: Number(raw.paidTotal ?? raw.paid_total ?? 0),
		invoiceCount: Number(raw.invoiceCount ?? raw.invoice_count ?? 0),
		recentInvoices: ((raw.recentInvoices ?? raw.recent_invoices) as unknown[])?.map(
			(inv) => normalizeInvoice(inv as Record<string, unknown>)
		) ?? [],
	};
}

function normalizeInvoice(raw: Record<string, unknown>): InvoiceInfo {
	return {
		id: String(raw.id),
		tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
		invoiceNumber: String(raw.invoiceNumber ?? raw.invoice_number ?? ""),
		amount: Number(raw.amount ?? 0),
		status: (String(raw.status ?? "UNPAID").toUpperCase() === "PAID" ? "PAID" : "UNPAID"),
		dueDate: (raw.dueDate ?? raw.due_date) as string | null | undefined,
		downloadUrl: (raw.downloadUrl ?? raw.download_url) as string | null | undefined,
		createdAt: (raw.createdAt ?? raw.created_at) as string | null | undefined,
	};
}

function normalizeClient(client: any): ClientInfo {
	return {
		id: client.id,
		tenantId: client.tenantId ?? client.tenant_id ?? undefined,
		name: client.name ?? "Untitled client",
		businessType: client.businessType ?? client.business_type ?? "",
		contactPerson: client.contactPerson ?? client.contact_person ?? "",
		email: client.email ?? "",
		phone: client.phone ?? "",
		status: (client.status ?? "INACTIVE") as ClientInfo["status"],
		subscriptionTier:
			client.subscriptionTier ?? client.subscription_tier ?? "STARTER",
		maxPlayers: client.maxPlayers ?? client.max_players ?? 0,
		maxStorageGb: client.maxStorageGb ?? client.max_storage_gb ?? 0,
		createdAt: client.createdAt ?? client.created_at ?? undefined,
	};
}

export default function ClientsClient() {
	const apiClient = getApiClient();
	const { user, isLoading: authLoading } = useAuth();
	const role = String(user?.role || "").toUpperCase();
	const isSuperAdmin = role === "SUPER_ADMIN";

	const [clients, setClients] = useState<ClientInfo[]>([]);
	const [query, setQuery] = useState("");
	const [pageLoading, setPageLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [toastOpen, setToastOpen] = useState(false);
	const [toastMessage, setToastMessage] = useState("Client created successfully");
	const [form, setForm] = useState<ClientFormState>(initialFormState);
	const [formError, setFormError] = useState<string | null>(null);
	const [billingByClientId, setBillingByClientId] = useState<
		Record<string, ClientBillingSummary>
	>({});
	const [invoiceClient, setInvoiceClient] = useState<ClientInfo | null>(null);
	const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
	const nameRef = useRef<HTMLInputElement>(null);
	const isEnterpriseTier = form.subscriptionTier === "ENTERPRISE";

	const loadClients = useCallback(async () => {
		if (!isSuperAdmin) {
			setPageLoading(false);
			setClients([]);
			return;
		}

		let cancelled = false;
		setPageLoading(true);
		setError(null);

		try {
			const [clientsRes, billingRes] = await Promise.all([
				apiClient.listClients(),
				apiClient.getClientsBillingOverview().catch(() => null),
			]);
			if (cancelled) return;
			setClients((clientsRes?.clients || []).map(normalizeClient));
			if (billingRes?.summaries) {
				const map: Record<string, ClientBillingSummary> = {};
				for (const s of billingRes.summaries) {
					const normalized = normalizeBillingSummary(s as unknown as Record<string, unknown>);
					map[normalized.clientId] = normalized;
				}
				setBillingByClientId(map);
			}
		} catch (err: any) {
			if (cancelled) return;
			const status = err?.response?.status;
			if (status === 403) {
				setError("You do not have permission to view this page.");
			} else {
				setError(
					err?.response?.data?.error || err?.message || "Failed to load clients"
				);
			}
			setClients([]);
		} finally {
			if (!cancelled) setPageLoading(false);
		}

		return () => {
			cancelled = true;
		};
	}, [apiClient, isSuperAdmin]);

	useEffect(() => {
		void loadClients();
	}, [loadClients]);

	useEffect(() => {
		if (!createOpen) {
			setFormError(null);
			setForm(initialFormState);
		}
	}, [createOpen]);

	useEffect(() => {
		if (form.subscriptionTier === "ENTERPRISE") return;

		const lock = tierLocks[form.subscriptionTier];
		setForm((prev) => {
			const nextPlayers = String(lock.maxPlayers);
			const nextStorage = String(lock.maxStorageGb);
			if (prev.maxPlayers === nextPlayers && prev.maxStorageGb === nextStorage) return prev;
			return { ...prev, maxPlayers: nextPlayers, maxStorageGb: nextStorage };
		});
	}, [form.subscriptionTier]);

	const filteredClients = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (!normalizedQuery) return clients;
		return clients.filter((client) => {
			const haystack = [
				client.name,
				client.businessType,
				client.contactPerson,
				client.email,
				client.phone,
				client.subscriptionTier,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [clients, query]);

	const handleCreateClient = async () => {
		const trimmedName = form.name.trim();
		const trimmedType = form.businessType.trim();
		const trimmedContact = form.contactPerson.trim();
		const trimmedEmail = form.email.trim();
		const trimmedPhone = form.phone.trim();

		if (!trimmedName || !trimmedType || !trimmedContact || !trimmedEmail || !trimmedPhone) {
			setFormError("Please complete all required fields before saving.");
			return;
		}

		const maxPlayers = Number(form.maxPlayers);
		const maxStorageGb = Number(form.maxStorageGb);

		if (isEnterpriseTier && (!Number.isFinite(maxPlayers) || maxPlayers < 1)) {
			setFormError("Max registered players must be a positive number.");
			return;
		}

		if (isEnterpriseTier && (!Number.isFinite(maxStorageGb) || maxStorageGb < 1)) {
			setFormError("Cloud storage quota must be a positive number.");
			return;
		}

		setCreateLoading(true);
		setFormError(null);

		try {
			const tier = form.subscriptionTier;
			const tierLock = tier === "ENTERPRISE" ? null : tierLocks[tier];
			const payload: ClientCreateInput = {
				name: trimmedName,
				businessType: trimmedType,
				subscriptionTier: tier,
				contactPerson: trimmedContact,
				email: trimmedEmail,
				phone: trimmedPhone,
				maxPlayers: tierLock ? tierLock.maxPlayers : maxPlayers,
				maxStorageGb: tierLock ? tierLock.maxStorageGb : maxStorageGb,
			};

			await apiClient.createClient(payload);
			await loadClients();
			setCreateOpen(false);
			setToastMessage(`Created client: ${trimmedName}`);
			setToastOpen(true);
			window.setTimeout(() => setToastOpen(false), 2500);
		} catch (err: any) {
			setFormError(err?.response?.data?.error || err?.message || "Failed to create client");
		} finally {
			setCreateLoading(false);
		}
	};

	if (authLoading || pageLoading) {
		return (
			<div className="flex-1 flex items-center justify-center bg-gray-50">
				<div className="text-sm text-gray-600">Loading clients…</div>
			</div>
		);
	}

	if (!isSuperAdmin) {
		return (
			<div className="flex-1 overflow-auto bg-gray-50">
				<div className="px-8 py-8">
					<div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
						<div className="flex items-center gap-3 text-gray-900">
							<ShieldAlert className="h-5 w-5 text-amber-500" />
							<h1 className="text-xl font-semibold">Clients</h1>
						</div>
						<p className="mt-3 text-sm text-gray-600">
							This area is available to{" "}
							<span className="font-semibold">SUPER_ADMIN</span> users only.
						</p>
						<p className="mt-2 text-sm text-gray-500">
							Your current role is{" "}
							<span className="font-medium">{role || "UNKNOWN"}</span>.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
							  <div className="shrink-0 border-b border-gray-200 bg-white">
				<div className="px-8 py-6">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0">
							<h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
							<p className="mt-1 text-sm text-gray-500">
								Manage tenant accounts, subscription tiers, and operational limits.
							</p>
						</div>

						<button
							type="button"
							onClick={() => setCreateOpen(true)}
							className="inline-flex items-center gap-2 rounded-md bg-[#A473FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
						>
							<Building2 size={16} />
							Create New Client
						</button>
					</div>

					<div className="mt-5 max-w-xl relative">
						<Search
							size={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by client, business type, or contact..."
							className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 shadow-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
						/>
						{query && (
							<button
								type="button"
								onClick={() => setQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								aria-label="Clear search"
							>
								<X size={16} />
							</button>
						)}
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<div className="px-8 py-6">
					{error && (
						<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
							{error}
						</div>
					)}

					{filteredClients.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
							<div className="rounded-full bg-gray-100 p-3 text-gray-500">
								<Building2 size={24} />
							</div>
							<h2 className="mt-4 text-sm font-semibold text-gray-900">
								{query ? "No clients match your search" : "No clients available"}
							</h2>
							<p className="mt-2 max-w-sm text-sm text-gray-500">
								{query
									? "Try a different search term or clear the query to see all records."
									: "Use the Create New Client button to add the first tenant record."}
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{filteredClients.map((client) => {
								const billing = billingByClientId[client.id];
								return (
									<ClientCard
										key={client.id}
										client={client}
										billing={billing}
										onIssueInvoice={() => {
											setInvoiceClient({
												...client,
												tenantId:
													client.tenantId ?? billing?.tenantId ?? undefined,
											});
											setInvoiceModalOpen(true);
										}}
									/>
								);
							})}
						</div>
					)}
				</div>
			</div>

			<AdminAddModal
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				title="Create New Client"
				onSave={handleCreateClient}
				saveDisabled={createLoading}
				initialFocusRef={nameRef}
			>
				<div className="space-y-5">
					{formError && (
						<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
							{formError}
						</div>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="Client / Business Name" required>
							<input
								ref={nameRef}
								value={form.name}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="e.g. Horizon Wellness Group"
								className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
							/>
						</Field>

						<Field label="Business Type / Domain" required>
							<input
								value={form.businessType}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, businessType: e.target.value }))
								}
								placeholder="e.g. Retail, Hospitality"
								className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
							/>
						</Field>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<Field label="Subscription Tier" required>
							<select
								value={form.subscriptionTier}
																	onChange={(e) => {
																		const nextTier = e.target.value as ClientFormState["subscriptionTier"];
																		setForm((prev) => {
																			if (nextTier === "ENTERPRISE") {
																				return { ...prev, subscriptionTier: nextTier };
																			}
																			const lock = tierLocks[nextTier];
																			return {
																				...prev,
																				subscriptionTier: nextTier,
																				maxPlayers: String(lock.maxPlayers),
																				maxStorageGb: String(lock.maxStorageGb),
																			};
																		});
																	}}
								className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
							>
								{subscriptionTiers.map((tier) => (
									<option key={tier} value={tier}>
										{tier}
									</option>
								))}
							</select>
						</Field>

						<Field label="Max Registered Players" required>
							<input
								type="number"
																	min={1}
																	max={!isEnterpriseTier ? tierLocks[form.subscriptionTier as Exclude<ClientFormState["subscriptionTier"], "ENTERPRISE">].maxPlayers : undefined}
								value={form.maxPlayers}
																	onChange={(e) => setForm((prev) => ({ ...prev, maxPlayers: e.target.value }))}
								placeholder="e.g. 25"
																	disabled={!isEnterpriseTier}
																	className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:bg-gray-50 disabled:text-gray-500"
							/>
																{!isEnterpriseTier && (
																	<p className="mt-1 text-xs text-gray-500">Locked to the selected tier limit.</p>
																)}
						</Field>

						<Field label="Cloud Storage Quota (GB)" required>
							<input
								type="number"
								min={1}
																	max={!isEnterpriseTier ? tierLocks[form.subscriptionTier as Exclude<ClientFormState["subscriptionTier"], "ENTERPRISE">].maxStorageGb : undefined}
								value={form.maxStorageGb}
								onChange={(e) => setForm((prev) => ({ ...prev, maxStorageGb: e.target.value }))}
								placeholder="e.g. 50"
																	disabled={!isEnterpriseTier}
																	className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 disabled:bg-gray-50 disabled:text-gray-500"
							/>
																{!isEnterpriseTier && (
																	<p className="mt-1 text-xs text-gray-500">Locked to the selected tier limit.</p>
																)}
						</Field>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<Field label="Primary Contact Name" required>
							<input
								value={form.contactPerson}
								onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
								placeholder="e.g. Maya Patel"
								className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
							/>
						</Field>

						<Field label="Active Email" required>
							<input
								type="email"
								value={form.email}
								onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
								placeholder="contact@example.com"
								className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
							/>
						</Field>

						<Field label="Phone Number" required>
							<input
								value={form.phone}
								onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
								placeholder="+1 555 123 4567"
								className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15"
							/>
						</Field>
					</div>
				</div>
			</AdminAddModal>

			<IssueInvoiceModal
				open={invoiceModalOpen}
				client={invoiceClient}
				onClose={() => {
					setInvoiceModalOpen(false);
					setInvoiceClient(null);
				}}
				onSuccess={() => {
					void loadClients();
					setToastMessage("Invoice registered successfully");
					setToastOpen(true);
				}}
			/>

			<AdminToast open={toastOpen} message={toastMessage} />
		</div>
	);
}

function Field({
	label,
	required,
	children,
}: {
	label: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<label className="block">
			<span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
				{label} {required ? <span className="text-red-500">*</span> : null}
			</span>
			{children}
		</label>
	);
}


function ClientCard({
	client,
	billing,
	onIssueInvoice,
}: {
	client: ClientInfo;
	billing?: ClientBillingSummary;
	onIssueInvoice: () => void;
}) {
	const statusStyles: Record<ClientInfo["status"], string> = {
		ACTIVE: "bg-green-50 text-green-700 border-green-100",
		INACTIVE: "bg-gray-50 text-gray-700 border-gray-200",
		TRIAL: "bg-blue-50 text-blue-700 border-blue-100",
	};

	const subscriptionStyles: Record<ClientInfo["subscriptionTier"], string> = {
		STARTER: "bg-gray-50 text-gray-700",
		PROFESSIONAL: "bg-purple-50 text-purple-700",
		ENTERPRISE: "bg-amber-50 text-amber-700",
	};

	return (
		<div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-gray-300 hover:shadow-md">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-3">
						<h3 className="truncate text-sm font-semibold text-gray-900">
							{client.name}
						</h3>
						<span
							className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[client.status]}`}
						>
							{client.status}
						</span>
					</div>

					<div className="mt-3 grid gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
						<Info label="Business Type" value={client.businessType || "—"} />
						<Info label="Contact" value={client.contactPerson || "—"} />
						<Info label="Email" value={client.email || "—"} icon={<Mail size={14} />} />
						<Info label="Phone" value={client.phone || "—"} icon={<Phone size={14} />} />
					</div>

					<div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
						<span
							className={`rounded-full px-2.5 py-1 font-medium ${subscriptionStyles[client.subscriptionTier]}`}
						>
							{billing?.planName || client.subscriptionTier}
						</span>
						<span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-600">
							{client.maxPlayers} players max
						</span>
						<span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-600">
							{client.maxStorageGb} GB storage max
						</span>
					</div>

					{billing && (
						<div className="mt-4 grid gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:grid-cols-3">
							<Info
								label="Total invoiced"
								value={formatMoney(billing.totalInvoiced)}
							/>
							<Info
								label="Outstanding"
								value={formatMoney(billing.outstandingBalance)}
							/>
							<Info
								label="Paid"
								value={formatMoney(billing.paidTotal)}
							/>
						</div>
					)}

					{billing && billing.recentInvoices.length > 0 && (
						<div className="mt-3 text-xs text-gray-500">
							<span className="font-medium text-gray-700">Recent: </span>
							{billing.recentInvoices
								.slice(0, 3)
								.map((inv) => inv.invoiceNumber)
								.join(" · ")}
						</div>
					)}
				</div>

				<div className="flex shrink-0 flex-col items-end gap-2 pt-1">
					<button
						type="button"
						onClick={onIssueInvoice}
						disabled={!(client.tenantId ?? billing?.tenantId)}
						className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Receipt size={14} />
						Issue invoice
					</button>
					<div className="text-gray-400">
						<ChevronRight size={20} />
					</div>
				</div>
			</div>
		</div>
	);
}

function Info({
	label,
	value,
	icon,
}: {
	label: string;
	value: string;
	icon?: React.ReactNode;
}) {
	return (
		<div className="min-w-0">
			<div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
			<div className="mt-1 flex items-center gap-1.5 truncate text-sm text-gray-700">
				{icon}
				<span className="truncate">{value}</span>
			</div>
		</div>
	);
}

