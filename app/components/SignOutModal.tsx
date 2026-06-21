"use client";

import React, { useEffect } from "react";
import { LogOut, X } from "lucide-react";
import ModalFooterActions from "@/app/clients/components/ModalFooterActions";
import {
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardIconChip,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

interface SignOutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  userEmail?: string;
}

export default function SignOutModal({
  open,
  onClose,
  onConfirm,
  userName,
  userEmail,
}: SignOutModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const displayName = userName?.trim() || userEmail?.trim() || "Your account";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className={cn(
          dashboardCardClass,
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden",
          dashboardAccentShadow
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-zinc-700/60">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div
                className={cn(
                  dashboardIconChip,
                  "h-8 w-8 rounded-lg bg-[#A473FF]/10 dark:bg-[#A473FF]/15"
                )}
              >
                <LogOut
                  size={15}
                  className="scale-x-[-1] text-[#8B5CF6] dark:text-[#A473FF]"
                  strokeWidth={2}
                />
              </div>
              <span className={dashboardSectionLabel}>Session</span>
            </div>
            <h2 id="sign-out-title" className={cn(dashboardPanelTitle, "text-lg")}>
              Sign out?
            </h2>
            <p className={cn(dashboardPanelSubtitle, "mt-1")}>
              You&apos;ll leave this workspace and return to the login screen. You can sign back in
              anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5">
          <p className={dashboardSectionLabel}>Signed in as</p>
          <div
            className={cn(
              dashboardCardClass,
              "mt-3 border border-[#A473FF]/15 bg-[#A473FF]/[0.04] p-4 dark:border-[#A473FF]/20 dark:bg-[#A473FF]/[0.08]"
            )}
          >
            <p className="font-medium text-gray-900 dark:text-zinc-100">{displayName}</p>
            {userEmail && userName ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{userEmail}</p>
            ) : null}
          </div>
        </div>

        <ModalFooterActions
          onCancel={onClose}
          primaryLabel="Sign out"
          primaryIcon={<LogOut size={16} strokeWidth={2} className="scale-x-[-1]" />}
          onPrimary={onConfirm}
          primaryVariant="gradient"
        />
      </div>
    </div>
  );
}
