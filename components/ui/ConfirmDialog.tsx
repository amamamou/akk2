"use client";

import React, { useEffect, useRef, useState } from "react";
import { Trash } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// A small focus-trap + body-scroll-lock + ESC-close dialog
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Mount for a short time after open turns false so we can play the close animation
  // Keep a simple, predictable mount lifecycle to satisfy the linter:
  // - Mount when `open` becomes true
  // - Unmount immediately when `open` is false
  // This means the close transition is effectively instant, but
  // we still keep the smooth open animation.
  useEffect(() => {
    setIsMounted(open);
    setIsVisible(open);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Close on Escape and trap focus inside dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const isShift = event.shiftKey;
        const active = document.activeElement as HTMLElement | null;

        if (!isShift && active === last) {
          event.preventDefault();
          first.focus();
        } else if (isShift && active === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onCancel]);

  // Focus the first interactive element on open
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      focusable.focus();
    } else {
      dialog.focus();
    }
  }, [open]);

  if (!isMounted) return null;

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onCancel();
    }
  };

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0",
        "bg-black/30 backdrop-blur-sm transition-opacity duration-150",
        isVisible ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!open}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        className={cn(
          "w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-xl",
          "border border-gray-100/60",
          "transition-all duration-150 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
          "focus:outline-none",
        )}
      >
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-rose-50 text-rose-500">
              <Trash size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="confirm-dialog-title"
                className="text-sm font-semibold text-gray-900 tracking-tight"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="confirm-dialog-description"
                  className="mt-2 text-xs sm:text-[13px] leading-relaxed text-gray-500"
                >
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100/60 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700",
              "bg-white hover:bg-gray-50",
              "border border-transparent hover:border-gray-200",
              "transition-transform transition-colors duration-150",
              "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/5 focus-visible:ring-offset-2",
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium",
              "bg-rose-100 text-rose-700 hover:bg-rose-200",
              "transition-transform transition-colors duration-150",
              "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 focus-visible:ring-offset-2",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
