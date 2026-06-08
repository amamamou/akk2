"use client";

import React from "react";
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
  const activeLabel = tabs.find((t) => t.key === activeTab)?.label ?? "";

  return (
    <div className="sticky top-20 z-10 bg-white border-b border-[#e5e5e5]">
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#1a1a1a] tracking-tight">Settings</h1>
            <p className="text-base text-[#666666] mt-2">{activeLabel}</p>
          </div>

          {dirty && (
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="inline-flex items-center justify-center gap-2 px-5 h-11 text-sm font-semibold text-[#1a1a1a] bg-white border border-[#e5e5e5] rounded-lg transition-all duration-200 hover:bg-[#f9f9fa] hover:border-[#d0d0d0]"
              >
                <X size={18} strokeWidth={2} />
                Cancel
              </button>
              <button
                onClick={onSave}
                className="inline-flex items-center justify-center gap-2 px-5 h-11 text-sm font-semibold text-white bg-[#A473FF] rounded-lg transition-all duration-200 hover:shadow-lg hover:opacity-92 active:opacity-85"
              >
                <Check size={18} strokeWidth={2} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Tab navigation - modern horizontal layout */}
        <div className="flex items-center gap-2 border-b border-[#e5e5e5] -mb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`
                  px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2
                  ${
                    isActive
                      ? "text-[#A473FF] border-b-[#A473FF]"
                      : "text-[#666666] border-b-transparent hover:text-[#1a1a1a] hover:border-b-[#e5e5e5]"
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
