"use client";

import React from "react";
import { X } from "lucide-react";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import ModalFooterActions from "./ModalFooterActions";

export default function ClientFormModalShell({
  open,
  onClose,
  titleId,
  sectionLabel,
  title,
  subtitle,
  icon,
  footerHint,
  isSubmitting,
  canSubmit,
  submitLabel,
  submittingLabel,
  submitIcon,
  onSubmit,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  sectionLabel: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  footerHint?: React.ReactNode;
  isSubmitting?: boolean;
  canSubmit: boolean;
  submitLabel: string;
  submittingLabel: string;
  submitIcon: React.ReactNode;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden sm:max-h-[90vh]",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn(dashboardIconChip, "h-8 w-8 rounded-lg")}>{icon}</div>
              <span className={dashboardSectionLabel}>{sectionLabel}</span>
            </div>
            <h2 id={titleId} className={cn(dashboardPanelTitle, "text-lg")}>
              {title}
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1 max-w-md")}>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <ModalFooterActions
          hint={footerHint}
          onCancel={onClose}
          cancelDisabled={isSubmitting}
          primaryLabel={submitLabel}
          primaryLoadingLabel={submittingLabel}
          primaryIcon={submitIcon}
          onPrimary={onSubmit}
          primaryDisabled={!canSubmit}
          primaryLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
