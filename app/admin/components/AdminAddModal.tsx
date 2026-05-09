"use client";

import React from "react";

export default function AdminAddModal({ open, onClose, title, children, onSave, saveDisabled, initialFocusRef }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saveDisabled?: boolean;
  initialFocusRef?: React.RefObject<HTMLInputElement>;
}) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const timer = setTimeout(() => {
      try {
        if (initialFocusRef?.current) initialFocusRef.current.focus();
        else {
          const el = dialogRef.current?.querySelector('input,button,select,textarea') as HTMLElement | null;
          el?.focus();
        }
      } catch {}
    }, 50);

    return () => {
      clearTimeout(timer);
      try { prev?.focus(); } catch {}
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6 sm:p-0">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div ref={dialogRef} className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden" role="dialog" aria-modal="true">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6">
          {children}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-50 hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={onSave} disabled={saveDisabled} className="px-4 py-2 rounded-md bg-[#A473FF] text-white disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}
