"use client";

import React from "react";
import { Plus, List } from "lucide-react";

type Cols = { duration: boolean; added: boolean; modified: boolean; addedBy: boolean };

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
    <div className="sticky top-0 z-10 bg-white border-gray-200">
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Audio</h1>
          <p className="mt-1 text-sm text-gray-500">Browse and manage your complete audio library</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setColsOpen((s) => !s)}
              className="inline-flex items-center gap-2 rounded-md bg-white text-gray-700 px-3 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50"
            >
              <List size={16} />
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
            className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
          >
            <Plus size={16} />
            <span>New audio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
