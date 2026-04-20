"use client";
import React from "react";
import { Plus, Music } from "lucide-react";
import Link from "next/link";
import ViewToggle from "./ViewToggle";

export default function PlayersHeader({
  view,
  onToggleView,
  onAdd,
}: {
  view: "list" | "grid";
  onToggleView: (v: "list" | "grid") => void;
  onAdd: () => void;
}) {
  return (
    <div className="bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            
            {/* Left */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Players
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage connected audio devices by location
              </p>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <ViewToggle view={view} onChange={onToggleView} />


              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7] transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Add player</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
