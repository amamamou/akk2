/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  const closeDialog = () => {
    setVisible(false);
    setTimeout(onCancel, 250);
  };

  const confirmAction = () => {
    setVisible(false);
    setTimeout(onConfirm, 250);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDialog}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-250 ${
          visible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-zinc-200 overflow-hidden">
          {/* Close */}
          <button
            onClick={closeDialog}
            className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="h-5 w-5" />
          </button>

     <div className="p-5">
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
      <LogOut className="h-4 w-4 scale-x-[-1] text-red-600" />
    </div>

    <div className="flex-1">
      <h2 className="text-base font-medium text-zinc-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  </div>

  <div className="mt-5 flex justify-end gap-2">
    <Button
      variant="ghost"
      onClick={closeDialog}
      className="h-9 px-4 text-zinc-600"
    >
      {cancelText}
    </Button>

    <Button
      onClick={confirmAction}
      className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white"
    >
      {confirmText}
    </Button>
  </div>
</div>
        </div>
      </div>
    </>
  );
}