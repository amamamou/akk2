"use client";

import React from "react";
import { Upload } from "lucide-react";
import {
  dashboardAccentShadow,
  dashboardHeroSectionClass,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function AudioHero({
  onUploadClick,
  searchSlot,
}: {
  onUploadClick: () => void;
  searchSlot: React.ReactNode;
}) {
  return (
    <section className={dashboardHeroSectionClass}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className={dashboardSectionLabel}>Library · Media assets</p>
          <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
            Audio
          </h1>
          <p className={cn(dashboardPanelSubtitle, "max-w-xl text-sm")}>
            Find, preview, and manage audio files used across playlists and broadcasts.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[420px] lg:w-auto">
          {searchSlot}
          <button
            type="button"
            onClick={onUploadClick}
            className={cn(
              "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-opacity hover:opacity-90",
              dashboardAccentShadow
            )}
            style={{
              background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
            }}
          >
            <Upload size={16} strokeWidth={2} />
            Upload audio
          </button>
        </div>
      </div>
    </section>
  );
}
