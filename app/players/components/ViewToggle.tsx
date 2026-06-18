"use client";
import React from "react";
import { LayoutList, LayoutGrid } from "lucide-react";

export default function ViewToggle({ view, onChange }: { view: "list" | "grid"; onChange: (v: "list" | "grid") => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F3F4F6] dark:bg-zinc-800 p-1">
      <button
        aria-label="List view"
        onClick={() => onChange("list")}
        className={`rounded-sm p-1.5 transition-colors duration-150 ${
          view === "list"
            ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm"
            : "text-gray-900 dark:text-zinc-400 hover:bg-[#E7E7E7] dark:hover:bg-zinc-700/80"
        }`}
        title="List view"
      >
        <LayoutList size={14} />
      </button>
      <button
        aria-label="Grid view"
        onClick={() => onChange("grid")}
        className={`rounded-sm p-1.5 transition-colors duration-150 ${
          view === "grid"
            ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm"
            : "text-gray-900 dark:text-zinc-400 hover:bg-[#E7E7E7] dark:hover:bg-zinc-700/80"
        }`}
        title="Grid view"
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}
