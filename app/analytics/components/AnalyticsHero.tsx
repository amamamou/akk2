"use client";

import React from "react";
import {
  dashboardHeroSectionClass,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function AnalyticsHero() {
  return (
    <section className={dashboardHeroSectionClass}>
      <div className="min-w-0 space-y-2">
        <p className={dashboardSectionLabel}>Operations · Listening metrics</p>
        <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
          Analytics
        </h1>
        <p className={cn(dashboardPanelSubtitle, "max-w-xl text-sm")}>
          Playback verification and listening metrics across your devices and programs.
        </p>
      </div>
    </section>
  );
}
