"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export function RequiredMark() {
  return (
    <span className="text-[#A473FF]" aria-hidden>
      *
    </span>
  );
}

export function FieldLabel({
  icon: Icon,
  label,
  required,
  optional,
}: {
  icon: React.ElementType;
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <Icon size={13} strokeWidth={2} className="text-gray-400" />
      <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">
        {label}
        {required ? (
          <>
            {" "}
            <RequiredMark />
          </>
        ) : null}
      </label>
      {optional ? <span className="text-xs text-gray-400">Optional</span> : null}
      {required ? <span className="text-xs text-gray-400">Required</span> : null}
    </div>
  );
}

export function FieldHelper({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-gray-400">{children}</p>;
}

export function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
      <AlertCircle size={12} className="shrink-0" strokeWidth={2.5} />
      {message}
    </p>
  );
}

export function fieldInputClass(hasError: boolean) {
  return cn(
    "h-10 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100",
    hasError
      ? "border-amber-300 focus:border-amber-400 focus:ring-amber-200/60 dark:border-amber-800 dark:focus:ring-amber-900/40"
      : "border-gray-200 focus:border-[#A473FF]/40 focus:ring-[#A473FF]/15 dark:border-zinc-700"
  );
}
