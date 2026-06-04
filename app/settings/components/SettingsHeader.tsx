"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

export type SettingsTab = {
  key: string;
  label: string;
};

interface SettingsHeaderProps {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  dirty: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export default function SettingsHeader({
  tabs,
  activeTab,
  onTabChange,
  dirty,
  onCancel,
  onSave,
}: SettingsHeaderProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState<React.CSSProperties>({});
  const [activeStyle, setActiveStyle] = useState<React.CSSProperties>({
    left: "0px",
    width: "0px",
  });

  // Derive the active index directly from the active tab
  const activeIndex = tabs.findIndex((t) => t.key === activeTab) ?? 0;

  // Hover highlight
  useEffect(() => {
    if (hoveredIndex === null) return;
    const hoveredEl = tabRefs.current[hoveredIndex];
    if (!hoveredEl) return;

    const { offsetLeft, offsetWidth } = hoveredEl;
    setHoverStyle({
      left: `${offsetLeft}px`,
      width: `${offsetWidth}px`,
    });
  }, [hoveredIndex]);

  // Active underline position
  useEffect(() => {
    const activeEl = tabRefs.current[activeIndex];
    if (!activeEl) return;

    const { offsetLeft, offsetWidth } = activeEl;
    setActiveStyle({
      left: `${offsetLeft}px`,
      width: `${offsetWidth}px`,
    });
  }, [activeIndex]);

  const activeLabel = tabs.find((t) => t.key === activeTab)?.label ?? "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F4F5]">
      <div className="sticky top-0 z-10 bg-[#F4F4F5]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">{activeLabel}</p>
            </div>

            <div className="flex items-center gap-2">
              {dirty && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={onCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={onSave}
                    className={"px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-2 bg-[#A473FF] text-white hover:bg-[#7A42FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"}
                  >
                    <Check size={16} /> Save changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="px-8 py-3 overflow-x-auto scrollbar-hide">
        <div className="inline-block bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-2">
          <div className="relative w-max">
            {/* Hover highlight */}
            <div
              className="absolute top-1 h-8 rounded-[6px] bg-gray-100 transition-all duration-300 ease-out flex items-center"
              style={{
                ...hoverStyle,
                opacity: hoveredIndex !== null ? 1 : 0,
              }}
            />

            {/* Active underline */}
            <div
              className="absolute bottom-0 h-[2px] bg-gray-900 transition-all duration-300 ease-out"
              style={activeStyle}
            />

            <div className="relative flex space-x-[6px] items-center">
              {tabs.map((t, index) => {
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => {
                      onTabChange(t.key);
                    }}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-300 h-10 flex items-center justify-center ${
                      isActive
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
