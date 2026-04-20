"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { PlayCircle, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const activityData = [
  { id: "act1", time: "08:00", broadcasts: 4 },
  { id: "act2", time: "09:00", broadcasts: 7 },
  { id: "act3", time: "10:00", broadcasts: 5 },
  { id: "act4", time: "11:00", broadcasts: 6 },
  { id: "act5", time: "12:00", broadcasts: 2 },
  { id: "act6", time: "13:00", broadcasts: 8 },
  { id: "act7", time: "14:00", broadcasts: 9 },
  { id: "act8", time: "15:00", broadcasts: 4 },
  { id: "act9", time: "16:00", broadcasts: 7 },
];

const heatmapData = [
  { id: "heat1", name: "Yoga Studio", total: 42, failed: 1 },
  { id: "heat2", name: "Lobby", total: 68, failed: 0 },
  { id: "heat3", name: "Therapy Room", total: 15, failed: 2 },
  { id: "heat4", name: "Retail Floor", total: 55, failed: 0 },
];

export default function AnalyticsClient() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50/30 p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Playback verification and listening metrics
          </p>
        </div>
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-gray-400">
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Total Broadcasts", value: "180", icon: PlayCircle },
          { title: "Listening Time", value: "324h", icon: Clock },
          { title: "Success Rate", value: "98.5%", icon: CheckCircle },
          { title: "Failed Plays", value: "3", icon: AlertCircle },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="p-3 bg-gray-100 rounded-full text-gray-700">
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-semibold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Player Activity Timeline
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dx={-10}
                />
                <RechartsTooltip
                  cursor={{
                    stroke: "#9CA3AF",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="broadcasts"
                  stroke="#374151"
                  strokeWidth={3}
                  dot={{ fill: "#374151", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Broadcasts by Location
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={heatmapData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dx={-10}
                />
                <RechartsTooltip
                  cursor={{ fill: "#F3F4F6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Bar
                  dataKey="total"
                  name="Successful"
                  fill="#4B5563"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  name="Failed"
                  fill="#D1D5DB"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Playback Verification Log
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              id: "log1",
              time: "10:05 AM",
              file: "Morning Flow (60m)",
              location: "Yoga Studio",
              status: "Completed",
              icon: CheckCircle,
            },
            {
              id: "log2",
              time: "09:30 AM",
              file: "Lobby Ambience",
              location: "Lobby",
              status: "Playing",
              icon: PlayCircle,
            },
            {
              id: "log3",
              time: "09:00 AM",
              file: "Therapy Binaural",
              location: "Therapy Room",
              status: "Failed",
              icon: AlertCircle,
            },
            {
              id: "log4",
              time: "08:00 AM",
              file: "Morning Flow (60m)",
              location: "Yoga Studio",
              status: "Completed",
              icon: CheckCircle,
            },
          ].map((log) => (
            <div
              key={log.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    log.status === "Failed"
                      ? "bg-gray-200 text-gray-500"
                      : "bg-gray-100 text-gray-700",
                  )}
                >
                  <log.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.file}
                  </p>
                  <p className="text-xs text-gray-500">{log.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500">{log.time}</span>
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full border",
                    log.status === "Completed"
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : log.status === "Playing"
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-gray-50 text-gray-500 border-gray-200",
                  )}
                >
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
