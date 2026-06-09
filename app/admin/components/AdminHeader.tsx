"use client";

import React from "react";
import { Plus, Search } from "lucide-react";

export default function AdminHeader({
  title,
  subtitle,
  onAdd,
  searchValue,
  setSearchValue,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  searchValue?: string;
  setSearchValue?: (v: string) => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-white  border-gray-200">
      <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {setSearchValue && (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></div>
              <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="w-56 pl-10 pr-3 py-2 text-sm rounded-md bg-gray-50 border border-gray-100" />
            </div>
          )}

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
