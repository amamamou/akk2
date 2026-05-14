"use client";

import React, { useRef, useState } from "react";
import { useAuth } from '@/app/context/AuthContext';
import { getApiClient } from '@/lib/api-client';
import {
  LineChart,
  Line,
  Area,
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
  const { user } = useAuth();
  const apiClient = getApiClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiClient.getAxiosInstance().post('/analytics/upload-csv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data;
      if (d?.ok) {
        setUploadResult(`Inserted ${d.inserted} rows`);
      } else {
        setUploadResult(`Upload failed: ${JSON.stringify(d)}`);
      }
    } catch (err: any) {
      setUploadResult(`Upload error: ${err?.message || String(err)}`);
    }
    // reset input
    if (fileRef.current) fileRef.current.value = '';
  }
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">Playback verification and listening metrics</p>
            </div>
            <div className="flex gap-2 items-center">
              <select className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white text-gray-700 outline-none focus:ring-1 focus:ring-gray-400">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>This Month</option>
              </select>
              {user?.role === 'SUPER_ADMIN' && (
                <>
                  <input ref={fileRef} type="file" accept=".csv" onChange={onUploadFile} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-3 py-1.5 text-sm font-medium hover:bg-[#E7E7E7]">Upload CSV</button>
                </>
              )}
              {uploadResult && <span className="text-sm text-gray-600 ml-3">{uploadResult}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Total Broadcasts", value: "180", icon: PlayCircle, bg: "#E6D2FF", fg: "#6B21A8" },
          { title: "Listening Time", value: "324h", icon: Clock, bg: "#E6E9FF", fg: "#374151" },
          { title: "Success Rate", value: "98.5%", icon: CheckCircle, bg: "#ECFDF5", fg: "#059669" },
          { title: "Failed Plays", value: "3", icon: AlertCircle, bg: "#FFF1F2", fg: "#DC2626" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-md flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={20} style={{ color: stat.fg }} />
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
                  stroke="#A473FF"
                  strokeWidth={3}
                  dot={{ fill: "#A473FF", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white  border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Broadcasts by Location
          </h3>
          <div className="mb-4 flex items-center justify-start gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#86EFAC' }} />
              <span>Successful</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F87171' }} />
              <span>Failed</span>
            </div>
          </div>

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
                <Bar
                  dataKey="total"
                  name="Successful"
                  fill="#86EFAC" /* emerald-300 */
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  name="Failed"
                  fill="#F87171" /* red-400 - clearer professional red */
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Playback Verification Log</h3>
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
                    "p-2 rounded-md flex items-center justify-center",
                    log.status === "Completed"
                      ? "bg-green-50 text-green-600"
                      : log.status === "Playing"
                        ? "bg-blue-50 text-blue-600"
                        : log.status === "Failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-700",
                  )}
                >
                  <log.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.file}</p>
                  <p className="text-xs text-gray-500">{log.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{log.time}</span>
                {/* badge with small icon + label (display 'Successful' for Completed) */}
                {(() => {
                  const label = log.status === "Completed" ? "Successful" : log.status;
                  const BadgeIcon = log.status === "Completed" ? CheckCircle : log.status === "Playing" ? PlayCircle : log.status === "Failed" ? AlertCircle : null;
                  return (
                    <span
                      className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-md border inline-flex items-center justify-center gap-2",
                        log.status === "Completed"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : log.status === "Playing"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : log.status === "Failed"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-gray-50 text-gray-600 border-gray-100",
                      )}
                    >
                      {BadgeIcon ? <BadgeIcon size={12} /> : null}
                      <span className="leading-none">{label}</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
