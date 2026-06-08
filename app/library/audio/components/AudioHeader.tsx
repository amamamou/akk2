"use client";

import React from "react";
import { Plus, List } from "lucide-react";

type Cols = { duration: boolean; added: boolean; modified: boolean; addedBy: boolean; size: boolean };

export default function AudioHeader({
  colsOpen,
  setColsOpen,
  visibleCols,
  toggleCol,
  setUploadOpen,
}: {
  colsOpen: boolean;
  setColsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  visibleCols: Cols;
  toggleCol: (k: keyof Cols) => void;
  setUploadOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="flex-1 flex flex-col bg-[#F4F4F5]">
      <div className="sticky top-0 z-10 bg-[#F4F4F5]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">All Audio</h1>
              <p className="mt-1 text-sm text-gray-500">Browse and manage your complete audio library</p>
            </div>

            <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setColsOpen((s) => !s)}
              className={
                `group inline-flex items-center gap-2 h-12 px-4 bg-white text-gray-700 text-sm font-medium rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg hover:translate-y-0.5 cursor-pointer`
              }
            >
              <span className="inline-flex items-center justify-center transition-colors">
                <List size={16} className="text-zinc-500 group-hover:text-[#A473FF] transition-colors" />
              </span>
              <span className="hidden sm:inline">Columns</span>
            </button>

            {colsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50">
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={visibleCols.duration} onChange={() => toggleCol("duration" as keyof Cols)} />
                    <span>Duration</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={visibleCols.size} onChange={() => toggleCol("size" as keyof Cols)} />
                    <span>Size</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={visibleCols.added} onChange={() => toggleCol("added" as keyof Cols)} />
                    <span>Added</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={visibleCols.modified} onChange={() => toggleCol("modified" as keyof Cols)} />
                    <span>Modified</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={visibleCols.addedBy} onChange={() => toggleCol("addedBy" as keyof Cols)} />
                    <span>Added by</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={
              `group inline-flex items-center gap-3 h-12 px-5 bg-white text-gray-900 font-medium text-sm rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg hover:translate-y-0.5 cursor-pointer`
            }
          >
            <span className="inline-flex items-center justify-center transition-colors">
              <Plus size={16} strokeWidth={1.9} className="text-zinc-500 group-hover:text-[#A473FF] transition-colors" />
            </span>

            <span>New audio</span>
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
