"use client";

import React from 'react';

export type Column<T> = { key: string; label: string; render?: (row: T) => React.ReactNode; className?: string };

export default function AdminTable<T extends { id: string }>({
  columns,
  rows,
  selected,
  onSelect,
  onSelectAll,
  onRowClick,
  onDeleteSelected,
}: {
  columns: Column<T>[];
  rows: T[];
  selected?: string[];
  onSelect?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onRowClick?: (row: T) => void;
  onDeleteSelected?: (ids: string[]) => void;
}) {
  const allSelected = selected && rows.length > 0 && selected.length === rows.length;

  return (
  <div className="rounded-lg bg-white border border-gray-100 overflow-hidden">
      {/* selection toolbar */}
      {selected && selected.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-700">{selected.length} selected</div>
          <div>
            <button
              type="button"
              onClick={() => onDeleteSelected?.(selected)}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-3 py-1 text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="sticky top-0 z-10 bg-white border-b border-gray-100">
              <th className="px-5 py-4 w-14 text-left">
                <input
                  aria-label="Select all rows"
                  type="checkbox"
                  checked={!!allSelected}
                  onChange={(e) => onSelectAll?.(e.currentTarget.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#A473FF] focus:ring-1 focus:ring-[#A473FF]/40"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-600 ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-sm text-gray-500">
                  No results
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onRowClick?.(r)}
                  className={`${onRowClick ? 'cursor-pointer' : ''} transition-colors duration-150 hover:bg-gray-50`}
                >
                  <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                    <input
                      aria-label={`Select row ${r.id}`}
                      type="checkbox"
                      checked={!!selected?.includes(r.id)}
                      onChange={(e) => onSelect?.(r.id, e.currentTarget.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-[#A473FF] focus:ring-1 focus:ring-[#A473FF]/40"
                    />
                  </td>

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-top text-sm text-gray-700 ${col.className ?? ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {col.render ? col.render(r) : String((r as unknown as Record<string, unknown>)[col.key] ?? '')}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
