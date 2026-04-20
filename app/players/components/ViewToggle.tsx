"use client";
import React from "react";
import { LayoutList, LayoutGrid } from "lucide-react";

export default function ViewToggle({ view, onChange }: { view: "list" | "grid"; onChange: (v: "list" | "grid") => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white p-1">
      <button 
        aria-label="List view" 
        onClick={() => onChange("list")} 
        className={`rounded-sm p-1.5 text-gray-600 transition-colors duration-150 ${
          view === "list" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
        }`}
      >
        <LayoutList size={14} />
      </button>
      <button 
        aria-label="Grid view" 
        onClick={() => onChange("grid")} 
        className={`rounded-sm p-1.5 text-gray-600 transition-colors duration-150 ${
          view === "grid" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
        }`}
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
}
