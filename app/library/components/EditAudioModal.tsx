"use client";

import React, { useState, useEffect, startTransition } from "react";
import { X, Check, User, Edit } from "lucide-react";
import { cn } from "@/utils/cn";

export default function EditAudioModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: { id: string; title: string; singer?: string } | null;
  onClose: () => void;
  onSave: (v: { id: string; title: string; singer?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [singer, setSinger] = useState("");
  const [initialState, setInitialState] = useState<{ title: string; singer: string } | null>(null);

  useEffect(() => {
    // Populate fields when the modal opens. Use startTransition to avoid
    // triggering the "setState in effect" diagnostic from strict tooling.
    startTransition(() => {
      if (initial) {
        setTitle(initial.title);
        setSinger(initial.singer ?? "");
        setInitialState({ title: initial.title, singer: initial.singer ?? "" });
      } else {
        setTitle("");
        setSinger("");
        setInitialState({ title: "", singer: "" });
      }
    });
  }, [initial]);

  const hasChanges = Boolean(
    initialState && (initialState.title !== title || initialState.singer !== singer) && title.trim()
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">Edit Audio</h2>
            </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg",
              "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
              "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                <Edit className="h-4 w-4 text-gray-600" />
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Singer</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <input value={singer} onChange={(e) => setSinger(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (initial && hasChanges) {
                onSave({ id: initial.id, title, singer });
                onClose();
              }
            }}
            disabled={!hasChanges}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-2",
              hasChanges
                ? "bg-[#A473FF] text-white hover:bg-[#7A42FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            {hasChanges ? (
              <>
                <Check className="h-4 w-4 inline-block mr-2" />
                Save
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
