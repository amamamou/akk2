"use client";

import React from "react";
import type { ReactElement } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

const TIER_COLORS: Record<string, string> = {
  BOUNCE: "#EDEBFF",
  STARTED: "#C4B3FF",
  LIGHT: "#A473FF",
  MODERATE: "#7C56E6",
  DEEP: "#5B3CC4",
  bounce: "#EDEBFF",
  started: "#C4B3FF",
  light: "#A473FF",
  moderate: "#7C56E6",
  deep: "#5B3CC4",
};

type EngagementDatum = {
  segment?: string;
  tier?: string;
  count?: number;
  description?: string;
};

export default function ChartsPanel({
  engagementData,
  hourlyTraffic,
}: {
  engagementData: EngagementDatum[];
  hourlyTraffic: unknown[];
}): ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-6 overflow-hidden">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-950 dark:text-zinc-100 leading-tight">
            Listener Distribution
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Engagement by listen duration (Bounce → Deep)
          </p>
        </div>
        <div className="h-60 flex items-center justify-center">
          {engagementData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">No playback data in range</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={1.5}
                  dataKey="count"
                  label={(props: PieLabelRenderProps) =>
                    `${props.name} ${props.percent ? (props.percent * 100).toFixed(0) : "0"}%`
                  }
                  labelLine={false}
                >
                  {engagementData.map((row, index) => (
                    <Cell
                      key={`cell-${row.tier ?? row.segment ?? index}`}
                      fill={TIER_COLORS[String(row.tier || "").toUpperCase()] ?? "#C4B3FF"}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    padding: "6px 10px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none p-6 overflow-hidden">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-950 dark:text-zinc-100 leading-tight">
            Traffic Patterns
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Hourly activity by engagement tier (same filtered logs)
          </p>
        </div>
        <div className="h-60 flex items-center justify-center">
          {hourlyTraffic.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">No playback data in range</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyTraffic} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a5af", fontSize: 10 }}
                  dy={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a5af", fontSize: 10 }}
                  dx={-4}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    padding: "6px 10px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: "#6b7280" }}
                />
                <Bar
                  dataKey="bounce"
                  name="Bounce"
                  stackId="a"
                  fill={TIER_COLORS.bounce}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="started"
                  name="Started"
                  stackId="a"
                  fill={TIER_COLORS.started}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="light"
                  name="Light"
                  stackId="a"
                  fill={TIER_COLORS.light}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="moderate"
                  name="Moderate"
                  stackId="a"
                  fill={TIER_COLORS.moderate}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="deep"
                  name="Deep"
                  stackId="a"
                  fill={TIER_COLORS.deep}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
