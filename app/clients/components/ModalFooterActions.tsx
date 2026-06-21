"use client";

import React from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/utils/cn";

const CANCEL_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

type ModalFooterActionsProps = {
  hint?: React.ReactNode;
  onCancel: () => void;
  cancelDisabled?: boolean;
  primaryLabel: string;
  primaryLoadingLabel?: string;
  primaryIcon: React.ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryVariant?: "gradient" | "danger";
};

export default function ModalFooterActions({
  hint,
  onCancel,
  cancelDisabled = false,
  primaryLabel,
  primaryLoadingLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  primaryVariant = "gradient",
}: ModalFooterActionsProps) {
  const loading = primaryLoading;
  const disabled = primaryDisabled || loading;
  const showPrimaryActive = !disabled && primaryVariant === "gradient";
  const showDangerActive = !disabled && primaryVariant === "danger";

  return (
    <footer className="flex flex-col-reverse items-stretch gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700/60">
      {hint ? (
        <p className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">{hint}</p>
      ) : (
        <span className="hidden sm:block" aria-hidden />
      )}

      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelDisabled || loading}
          className={cn(CANCEL_CLASS, "min-w-[6.5rem]")}
        >
          <X size={15} strokeWidth={2} className="shrink-0 opacity-70" />
          Cancel
        </button>

        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled}
          className={cn(
            "inline-flex h-10 min-w-[7.5rem] items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition-all",
            showPrimaryActive && "text-white hover:opacity-90",
            showDangerActive &&
              "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]",
            disabled &&
              "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
          )}
          style={
            showPrimaryActive
              ? {
                  background:
                    "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
                }
              : undefined
          }
        >
          {loading ? (
            <Loader2 size={16} strokeWidth={2} className="shrink-0 animate-spin" />
          ) : (
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{primaryIcon}</span>
          )}
          {loading && primaryLoadingLabel ? primaryLoadingLabel : primaryLabel}
        </button>
      </div>
    </footer>
  );
}
