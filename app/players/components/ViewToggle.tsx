"use client";
import React from "react";
import { LayoutList, LayoutGrid } from "lucide-react";

export default function ViewToggle({ view, onChange }: { view: "list" | "grid"; onChange: (v: "list" | "grid") => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F3F4F6] p-1">
      <button
        aria-label="List view"
        onClick={() => onChange("list")}
        className={`rounded-sm p-1.5 text-gray-900 transition-colors duration-150 ${
          view === "list" ? "bg-white text-gray-900 shadow-sm" : "hover:bg-[#E7E7E7]"
        }`}
        title="List view"
      >
        <LayoutList size={14} />
      </button>
      <button
        aria-label="Grid view"
        onClick={() => onChange("grid")}
        className={`rounded-sm p-1.5 text-gray-900 transition-colors duration-150 ${
          view === "grid" ? "bg-white text-gray-900 shadow-sm" : "hover:bg-[#E7E7E7]"
        }`}
        title="Grid view"
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}
