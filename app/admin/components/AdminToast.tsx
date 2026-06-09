"use client";

import React from "react";

export default function AdminToast({ open, message }: { open: boolean; message?: string }) {
  if (!open) return null;
  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-md shadow-md text-sm text-gray-900">
        {message}
      </div>
    </div>
  );
}
