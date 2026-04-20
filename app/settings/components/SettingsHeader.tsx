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
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">{activeLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            {dirty && (
              <>
                <button
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={onSave}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7318FF] rounded-lg hover:bg-[#5e12d9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7318FF]/40"
                >
                  <Check size={16} /> Save changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <nav className="px-8 py-3 border-t border-gray-200 overflow-x-auto scrollbar-hide">
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
      </nav>
    </div>
  );
}
