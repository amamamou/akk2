import React from "react";
import { cn } from "@/utils/cn";
import { dashboardCardClass, dashboardCardPadding, dashboardPanelSubtitle, dashboardPanelTitle } from "../dashboard-styles";

interface DashboardPanelProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  headerBorder?: boolean;
}

export default function DashboardPanel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  noPadding,
  headerBorder = true,
}: DashboardPanelProps) {
  return (
    <section className={cn(dashboardCardClass, "h-fit min-h-0 w-full", className)}>
      {title && (
        <header
          className={cn(
            "flex items-start justify-between gap-3 px-6 py-4",
            headerBorder && "border-b border-gray-100 dark:border-zinc-700/60"
          )}
        >
          <div className="min-w-0">
            <h2 className={dashboardPanelTitle}>{title}</h2>
            {subtitle && <p className={dashboardPanelSubtitle}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(!noPadding && dashboardCardPadding, bodyClassName)}>{children}</div>
    </section>
  );
}
