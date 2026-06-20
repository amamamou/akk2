"use client";

import React from "react";
import { motion } from "framer-motion";
import type { OperationalOverview } from "@/lib/dashboard-insights";
import {
  dashboardAccentGradient,
  dashboardAccentShadow,
  dashboardCardClass,
  dashboardMetricValue,
} from "../dashboard-styles";

interface MetricDef {
  key: keyof Pick<
    OperationalOverview,
    "broadcasts" | "activePlayers" | "clients" | "successRate" | "offlineCount"
  >;
  label: string;
  format: (v: number) => string;
  highlight?: boolean;
}

function formatPercent(v: number) {
  return `${v.toFixed(1)}%`;
}

export default function OperationalMetricsStrip({
  overview,
}: {
  overview: OperationalOverview;
}) {
  const metrics: MetricDef[] = [
    { key: "broadcasts", label: "Broadcasts today", format: (v) => String(v), highlight: true },
    { key: "activePlayers", label: "Active players", format: (v) => String(v) },
    { key: "clients", label: "Clients", format: (v) => String(v) },
    { key: "successRate", label: "Success rate", format: formatPercent },
    { key: "offlineCount", label: "Offline players", format: (v) => String(v) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric, i) => {
        const value = overview[metric.key];
        const display = metric.format(value);
        const isHighlight = metric.highlight;

        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
            className={[
              "flex h-[112px] flex-col justify-between rounded-2xl px-5 py-4",
              isHighlight
                ? `text-white ${dashboardAccentShadow}`
                : dashboardCardClass,
            ].join(" ")}
            style={isHighlight ? { background: dashboardAccentGradient } : undefined}
          >
            <p
              className={[
                "text-[28px] font-semibold leading-none tracking-tight tabular-nums sm:text-[30px]",
                isHighlight ? "text-white" : dashboardMetricValue,
              ].join(" ")}
            >
              {display}
            </p>
            <p
              className={[
                "text-sm font-medium",
                isHighlight ? "text-white/70" : "text-gray-500 dark:text-zinc-400",
              ].join(" ")}
            >
              {metric.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
