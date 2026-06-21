"use client";

import React from "react";
import { Building2, HardDrive, Repeat, UserRound, Users } from "lucide-react";
import { dashboardSectionLabel } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import {
  PLAN_OPTIONS,
  tierLocks,
  type ClientFormFieldKey,
  type ClientFormState,
  type SubscriptionTier,
} from "../lib/client-form-validation";

export const CLIENT_INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function ClientFormField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={dashboardSectionLabel}>
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ClientFormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <span className="mt-0.5 text-gray-400">
            <Icon size={15} strokeWidth={1.75} />
          </span>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold text-gray-950 dark:text-zinc-100">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function fieldErrorClass(show: boolean) {
  return show ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200/50" : "";
}

export default function ClientFormFields({
  form,
  touched,
  fieldErrors,
  idPrefix,
  nameRef,
  onFieldChange,
  onFieldBlur,
  onSelectTier,
}: {
  form: ClientFormState;
  touched: Partial<Record<ClientFormFieldKey, boolean>>;
  fieldErrors: Partial<Record<ClientFormFieldKey, string>>;
  idPrefix: string;
  nameRef?: React.RefObject<HTMLInputElement | null>;
  onFieldChange: <K extends ClientFormFieldKey>(key: K, value: ClientFormState[K]) => void;
  onFieldBlur: (key: ClientFormFieldKey) => void;
  onSelectTier: (tier: SubscriptionTier) => void;
}) {
  const isEnterprise = form.subscriptionTier === "ENTERPRISE";

  return (
    <div className="space-y-8">
      <ClientFormSection
        title="Business information"
        description="How this client appears across the platform."
        icon={Building2}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ClientFormField
            id={`${idPrefix}-name`}
            label="Client name"
            required
            hint="Legal or trading name for the workspace."
            error={touched.name ? fieldErrors.name : null}
          >
            <input
              ref={nameRef}
              id={`${idPrefix}-name`}
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              onBlur={() => onFieldBlur("name")}
              placeholder="e.g. Horizon Wellness Group"
              className={cn(CLIENT_INPUT_CLASS, fieldErrorClass(Boolean(touched.name && fieldErrors.name)))}
            />
          </ClientFormField>

          <ClientFormField
            id={`${idPrefix}-businessType`}
            label="Business type"
            required
            hint="Industry or domain — helps organize accounts."
            error={touched.businessType ? fieldErrors.businessType : null}
          >
            <input
              id={`${idPrefix}-businessType`}
              value={form.businessType}
              onChange={(e) => onFieldChange("businessType", e.target.value)}
              onBlur={() => onFieldBlur("businessType")}
              placeholder="e.g. Retail, Hospitality"
              className={cn(
                CLIENT_INPUT_CLASS,
                fieldErrorClass(Boolean(touched.businessType && fieldErrors.businessType))
              )}
            />
          </ClientFormField>
        </div>
      </ClientFormSection>

      <ClientFormSection
        title="Subscription"
        description="Choose a plan — limits apply to players and media storage."
        icon={Repeat}
        className="border-t border-gray-100 pt-8 dark:border-zinc-800"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLAN_OPTIONS.map((plan) => {
            const selected = form.subscriptionTier === plan.tier;
            return (
              <button
                key={plan.tier}
                type="button"
                onClick={() => onSelectTier(plan.tier)}
                aria-pressed={selected}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  selected
                    ? "border-[#A473FF]/40 bg-[#A473FF]/5 ring-1 ring-[#A473FF]/25 dark:bg-[#A473FF]/10"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                )}
              >
                <p className="text-sm font-semibold text-gray-950 dark:text-zinc-100">{plan.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
                  {plan.description}
                </p>
                <p className="mt-2 text-xs font-medium text-[#7C3AED] dark:text-[#A473FF]">
                  {plan.highlight}
                </p>
              </button>
            );
          })}
        </div>

        {isEnterprise ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ClientFormField
              id={`${idPrefix}-maxPlayers`}
              label="Player limit"
              required
              hint="Maximum registered devices for this workspace."
              error={touched.maxPlayers ? fieldErrors.maxPlayers : null}
            >
              <div className="relative">
                <Users
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-gray-400"
                />
                <input
                  id={`${idPrefix}-maxPlayers`}
                  type="number"
                  min={1}
                  value={form.maxPlayers}
                  onChange={(e) => onFieldChange("maxPlayers", e.target.value)}
                  onBlur={() => onFieldBlur("maxPlayers")}
                  placeholder="e.g. 50"
                  className={cn(CLIENT_INPUT_CLASS, "pl-10", fieldErrorClass(Boolean(touched.maxPlayers && fieldErrors.maxPlayers)))}
                />
              </div>
            </ClientFormField>

            <ClientFormField
              id={`${idPrefix}-maxStorageGb`}
              label="Storage limit (GB)"
              required
              hint="Cloud storage for audio and playlist assets."
              error={touched.maxStorageGb ? fieldErrors.maxStorageGb : null}
            >
              <div className="relative">
                <HardDrive
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-gray-400"
                />
                <input
                  id={`${idPrefix}-maxStorageGb`}
                  type="number"
                  min={1}
                  value={form.maxStorageGb}
                  onChange={(e) => onFieldChange("maxStorageGb", e.target.value)}
                  onBlur={() => onFieldBlur("maxStorageGb")}
                  placeholder="e.g. 100"
                  className={cn(CLIENT_INPUT_CLASS, "pl-10", fieldErrorClass(Boolean(touched.maxStorageGb && fieldErrors.maxStorageGb)))}
                />
              </div>
            </ClientFormField>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-zinc-800/50">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-300">
              <Users size={13} className="text-gray-400" />
              {tierLocks[form.subscriptionTier as Exclude<SubscriptionTier, "ENTERPRISE">]?.maxPlayers ??
                form.maxPlayers}{" "}
              players included
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-300">
              <HardDrive size={13} className="text-gray-400" />
              {tierLocks[form.subscriptionTier as Exclude<SubscriptionTier, "ENTERPRISE">]?.maxStorageGb ??
                form.maxStorageGb}{" "}
              GB storage included
            </span>
          </div>
        )}
      </ClientFormSection>

      <ClientFormSection
        title="Primary contact"
        description="Who we reach for billing and account matters."
        icon={UserRound}
        className="border-t border-gray-100 pt-8 dark:border-zinc-800"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ClientFormField
            id={`${idPrefix}-contactPerson`}
            label="Contact name"
            required
            error={touched.contactPerson ? fieldErrors.contactPerson : null}
          >
            <input
              id={`${idPrefix}-contactPerson`}
              value={form.contactPerson}
              onChange={(e) => onFieldChange("contactPerson", e.target.value)}
              onBlur={() => onFieldBlur("contactPerson")}
              placeholder="e.g. Maya Patel"
              className={cn(
                CLIENT_INPUT_CLASS,
                fieldErrorClass(Boolean(touched.contactPerson && fieldErrors.contactPerson))
              )}
            />
          </ClientFormField>

          <ClientFormField
            id={`${idPrefix}-email`}
            label="Email"
            required
            error={touched.email ? fieldErrors.email : null}
          >
            <input
              id={`${idPrefix}-email`}
              type="email"
              value={form.email}
              onChange={(e) => onFieldChange("email", e.target.value)}
              onBlur={() => onFieldBlur("email")}
              placeholder="contact@example.com"
              autoComplete="email"
              className={cn(CLIENT_INPUT_CLASS, fieldErrorClass(Boolean(touched.email && fieldErrors.email)))}
            />
          </ClientFormField>

          <ClientFormField
            id={`${idPrefix}-phone`}
            label="Phone"
            required
            hint="Include country code when possible."
            error={touched.phone ? fieldErrors.phone : null}
          >
            <input
              id={`${idPrefix}-phone`}
              type="tel"
              value={form.phone}
              onChange={(e) => onFieldChange("phone", e.target.value)}
              onBlur={() => onFieldBlur("phone")}
              placeholder="+1 555 123 4567"
              autoComplete="tel"
              className={cn(CLIENT_INPUT_CLASS, fieldErrorClass(Boolean(touched.phone && fieldErrors.phone)))}
            />
          </ClientFormField>
        </div>
      </ClientFormSection>
    </div>
  );
}
