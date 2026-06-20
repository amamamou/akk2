"use client";

import React from "react";
import { dashboardCardClass } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function AudioListPanel({
  children,
  summary,
  refreshing,
  className,
}: {
  children: React.ReactNode;
  summary?: React.ReactNode;
  refreshing?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        dashboardCardClass,
        "overflow-hidden",
        refreshing && "pointer-events-none opacity-60 transition-opacity",
        className
      )}
    >
      {summary ? (
        <div className="border-b border-gray-100 px-4 py-2.5 dark:border-zinc-800 sm:px-5">
          {summary}
        </div>
      ) : null}
      {children}
    </section>
  );
}
