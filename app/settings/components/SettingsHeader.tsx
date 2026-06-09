"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, CreditCard, Sparkles, User, X } from "lucide-react";

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
const TAB_ICONS = {
  "my-details": User,
  plan: Sparkles,
  billing: CreditCard,
};
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
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between gap-8">
           <div className="flex items-start justify-between w-full">
  <div>
  <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">{activeLabel}</p>
            </div>
  </div>
<div className="hidden lg:flex items-center gap-1 rounded-2xl bg-zinc-100 p-1">
  {tabs.map((t) => {
    const isActive = activeTab === t.key;
    const Icon =
      TAB_ICONS[t.key as keyof typeof TAB_ICONS];

    return (
      <button
        key={t.key}
        onClick={() => onTabChange(t.key)}
        className={`
          flex
          items-center
          gap-2
          rounded-xl
          px-4
          py-2
          text-sm
          font-medium
          transition-all
          ${
            isActive
              ? "bg-white text-zinc-950 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900"
          }
        `}
      >
        {Icon && <Icon size={15} />}
        {t.label}
      </button>
    );
  })}
</div>
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

  
    </div>
  );
}
