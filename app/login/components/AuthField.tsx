"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  autoComplete?: string;
  trailing?: React.ReactNode;
}

export default function AuthField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  autoComplete,
  trailing,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[13px] font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        ) : null}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={cn(
            "flex h-12 w-full rounded-xl border border-zinc-200/80 bg-white text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all placeholder:text-zinc-400",
            "focus:border-[#A473FF]/40 focus:outline-none focus:ring-4 focus:ring-[#A473FF]/10",
            Icon ? "pl-10 pr-3" : "px-3.5",
            trailing && "pr-11"
          )}
        />
        {trailing ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
        ) : null}
      </div>
    </div>
  );
}
