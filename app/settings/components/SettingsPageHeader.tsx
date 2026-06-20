"use client";

import React from "react";
import {
  dashboardHeroSectionClass,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function SettingsPageHeader() {
  return (
    <header className={dashboardHeroSectionClass}>
      <div className="min-w-0 space-y-2">
        <p className={dashboardSectionLabel}>Account · Workspace</p>
        <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
          Settings
        </h1>
        <p className={cn(dashboardPanelSubtitle, "text-sm")}>
          Manage your profile, subscription, and billing.
        </p>
      </div>
    </header>
  );
}
