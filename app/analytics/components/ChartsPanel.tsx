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
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

export default function ChartsPanel({
  engagementData,
  hourlyTraffic,
}: {
  engagementData: unknown[];
  hourlyTraffic: unknown[];
}): ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 overflow-hidden">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-950 leading-tight">Listener Distribution</h3>
          <p className="text-xs text-gray-500 mt-0.5">Engagement tier segmentation</p>
        </div>
        <div className="h-60 flex items-center justify-center">
          {engagementData.length === 0 ? (
            <p className="text-sm text-gray-400">No playback data in range</p>
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
                  <Cell fill="#A473FF" />
                  <Cell fill="#7C56E6" />
                  <Cell fill="#C4B3FF" />
                  <Cell fill="#EDEBFF" />
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 overflow-hidden">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-950 leading-tight">Traffic Patterns</h3>
          <p className="text-xs text-gray-500 mt-0.5">Hourly activity by engagement tier (same filtered logs)</p>
        </div>
        <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyTraffic} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#a1a5af", fontSize: 10 }} dy={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a5af", fontSize: 10 }} dx={-4} />
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
              <Bar dataKey="engaged" stackId="a" fill="#A473FF" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="deep" stackId="a" fill="#7C56E6" isAnimationActive={false} />
              <Bar dataKey="moderate" stackId="a" fill="#C4B3FF" isAnimationActive={false} />
              <Bar dataKey="light" stackId="a" fill="#EDEBFF" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
