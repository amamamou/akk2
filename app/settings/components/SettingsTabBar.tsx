"use client";

import React from "react";
import { CreditCard, Repeat, UserRound } from "lucide-react";
import { cn } from "@/utils/cn";

export type SettingsTabKey = "my-details" | "plan" | "billing";

export type SettingsTab = {
  key: SettingsTabKey;
  label: string;
};

const TAB_ICONS: Record<SettingsTabKey, React.ElementType> = {
  "my-details": UserRound,
  plan: Repeat,
  billing: CreditCard,
};

export default function SettingsTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  return (
    <nav
      aria-label="Settings sections"
      className="border-b border-gray-100/90 px-6 dark:border-zinc-800/80 sm:px-8"
    >
      <div role="tablist" className="flex gap-7 sm:gap-9">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = TAB_ICONS[tab.key as SettingsTabKey] ?? UserRound;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "group -mb-px flex items-center gap-2 border-b-2 py-3.5 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A473FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                active
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              )}
            >
              <Icon
                size={15}
                strokeWidth={1.75}
                aria-hidden
                className={cn(
                  "shrink-0 transition-opacity",
                  active ? "opacity-100" : "opacity-55 group-hover:opacity-75"
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
