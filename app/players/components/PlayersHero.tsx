"use client";

import React from "react";
import { Plus } from "lucide-react";
import {
  dashboardAccentShadow,
  dashboardHeroSectionClass,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

interface PlayersHeroProps {
  onAddClick?: () => void;
  addDisabled?: boolean;
  searchSlot: React.ReactNode;
}

export default function PlayersHero({
  onAddClick,
  addDisabled = false,
  searchSlot,
}: PlayersHeroProps) {
  return (
    <section className={dashboardHeroSectionClass}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className={dashboardSectionLabel}>Operations · Fleet</p>
          <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
            Players
          </h1>
          <p className={cn(dashboardPanelSubtitle, "max-w-lg text-sm")}>
            Monitor devices and playback across your locations.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[420px] lg:w-auto">
          {searchSlot}
          {onAddClick ? (
            <button
              type="button"
              onClick={onAddClick}
              disabled={addDisabled}
              className={cn(
                "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                dashboardAccentShadow
              )}
              style={{
                background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add player
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
