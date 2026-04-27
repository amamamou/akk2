"use client";

import React, { useRef } from "react";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface Props {
  query: string;
  setQuery: (s:string)=>void;
  filteredCount: number;
  totalCount: number;
  page: number;
  setPage: (n:number)=>void;
  perPage: number;
  setPerPage: (n:number)=>void;
  perPageOptions: number[];
  totalPages: number;
  placeholder?: string;
}

export default function AudioToolbar(p: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="border-gray-100 bg-white">
      <div className="px-4 sm:px-7 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                ref={inputRef}
                aria-label="Search audio"
                value={p.query}
                onChange={(e) => p.setQuery(e.target.value)}
                placeholder={p.placeholder ?? "Search by title, playlist, artist, creator."}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-md bg-[#F3F4F6]"
                suppressHydrationWarning
              />
              {p.query && (
                <button
                  onClick={() => { p.setQuery(''); inputRef.current?.focus(); }}
                  title="Clear search"
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1 rounded hover:bg-gray-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="text-sm text-gray-600 whitespace-nowrap"></div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                <div>Showing <span className="text-gray-900 font-medium">{Math.min((p.page - 1) * p.perPage + 1, p.filteredCount || 1)}</span>–<span className="text-gray-900 font-medium">{Math.min(p.page * p.perPage, p.filteredCount)}</span> of <span className="text-gray-900 font-medium">{p.filteredCount}</span></div>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Per page</span>
                  <select value={p.perPage} onChange={(e) => { p.setPerPage(Number(e.target.value)); p.setPage(1); }} className="ml-1 text-sm bg-white border border-gray-200 rounded px-2 py-1">
                    {p.perPageOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => p.setPage(Math.max(1, p.page - 1))}
                  disabled={p.page <= 1}
                  className={cn("p-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50", p.page <= 1 ? "opacity-50 cursor-not-allowed" : "")}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-sm text-gray-700">{p.page} / {p.totalPages}</div>

                <button
                  onClick={() => p.setPage(Math.min(p.totalPages, p.page + 1))}
                  disabled={p.page >= p.totalPages}
                  className={cn("p-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50", p.page >= p.totalPages ? "opacity-50 cursor-not-allowed" : "")}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
