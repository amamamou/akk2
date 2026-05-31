"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Users,
  Activity,
  Loader2,
} from "lucide-react";
import type { PieLabelRenderProps } from "recharts";
import { cn } from "@/utils/cn";
import { getApiClient } from "@/lib/api-client";
import type { AnalyticsTimelineEntry, SystemHealthMetrics } from "@/types/api";

const POLL_MS = 30_000;

interface HourlyTrafficData {
  hour: string;
  engaged: number;
  deep: number;
  moderate: number;
  light: number;
}

interface PlaybackLogRow {
  id: string;
  time: string;
  file: string;
  location: string;
  status: string;
  icon: React.ElementType;
  device?: string;
  latency?: string;
  duration?: string;
  quality?: string;
  sessionId?: string;
}

function timelineToHourlyTraffic(timeline: AnalyticsTimelineEntry[]): HourlyTrafficData[] {
  return timeline.map((entry) => {
    const total = entry.total || 0;
    const successful = entry.successful || 0;
    const failed = entry.failed || 0;
    const other = Math.max(0, total - successful - failed);
    return {
      hour: entry.hour,
      engaged: successful,
      deep: Math.round(successful * 0.35),
      moderate: Math.round(other * 0.6),
      light: failed + Math.round(other * 0.4),
    };
  });
}

function timelineToActivityData(timeline: AnalyticsTimelineEntry[]) {
  return timeline.map((entry, index) => ({
    id: `act-${index}`,
    time: entry.hour,
    broadcasts: entry.total,
  }));
}

function buildEngagementData(health: SystemHealthMetrics | null) {
  const successful = health?.successfulPlaybacks ?? 0;
  const failed = health?.failedPlaybacks ?? 0;
  const inFlight = Math.max(
    0,
    (health?.totalPlaybackLogs ?? 0) - successful - failed,
  );
  return [
    { id: "e1", segment: "Successful", count: successful },
    { id: "e2", segment: "In progress", count: inFlight },
    { id: "e3", segment: "Failed", count: failed },
  ].filter((row) => row.count > 0);
}

function buildPlaybackLogs(timeline: AnalyticsTimelineEntry[]): PlaybackLogRow[] {
  return [...timeline]
    .filter((entry) => entry.total > 0)
    .slice(-8)
    .reverse()
    .map((entry, index) => {
      const failed = entry.failed > 0;
      const playing = entry.successful > 0 && entry.failed === 0 && entry.total > entry.successful;
      const status = failed ? "Failed" : playing ? "Playing" : "Completed";
      const Icon = failed ? AlertCircle : playing ? PlayCircle : CheckCircle;
      return {
        id: `log-${entry.hour}-${index}`,
        time: entry.hour,
        file: `${entry.total} playback event${entry.total === 1 ? "" : "s"}`,
        location: "All players",
        status,
        icon: Icon,
        device: "Live API",
        latency: "—",
        duration: `${entry.successful}/${entry.total} ok`,
        quality: failed ? "SD" : "HD",
        sessionId: `tl-${entry.hour}`,
      };
    });
}

export default function AnalyticsClient() {
  const apiClient = getApiClient();
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsTimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!apiClient.isAuthenticated()) {
          if (!cancelled) {
            setError("Sign in to view live analytics.");
            setIsLoading(false);
          }
          return;
        }

        const [healthRes, timelineRes] = await Promise.all([
          apiClient.getSystemHealth().catch(() => null),
          apiClient.getAnalyticsTimeline().catch(() => ({ ok: false, timeline: [] })),
        ]);

        if (cancelled) return;

        if (healthRes) {
          setHealth(healthRes as SystemHealthMetrics);
        }
        setTimeline(timelineRes?.timeline ?? []);
        setError(null);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load analytics";
          setError(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    const intervalId = window.setInterval(() => void load(), POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [apiClient]);

  const hourlyTraffic = useMemo(() => timelineToHourlyTraffic(timeline), [timeline]);
  const activityData = useMemo(() => timelineToActivityData(timeline), [timeline]);
  const engagementData = useMemo(() => buildEngagementData(health), [health]);
  const playbackLogs = useMemo(() => buildPlaybackLogs(timeline), [timeline]);

  const peakHour = useMemo(() => {
    if (!timeline.length) return "—";
    const peak = [...timeline].sort((a, b) => b.total - a.total)[0];
    return peak?.hour ?? "—";
  }, [timeline]);

  const kpiCards = useMemo(() => {
    const successRate = health?.heartbeatSuccessRate ?? 0;
    const totalLogs = health?.totalPlaybackLogs ?? 0;
    const online = health?.onlinePlayers ?? 0;
    const totalPlayers = health?.totalPlayers ?? 0;

    return [
      {
        title: "Heartbeat Success",
        value: `${successRate.toFixed(1)}%`,
        icon: Activity,
        trend: health?.ok ? "live" : "—",
        meta: `${health?.successfulPlaybacks ?? 0} completed events`,
      },
      {
        title: "Players Online",
        value: String(online),
        icon: Users,
        trend: `${totalPlayers} total`,
        meta: `${health?.offlinePlayers ?? 0} offline`,
      },
      {
        title: "Playback Events",
        value: totalLogs.toLocaleString(),
        icon: Clock,
        trend: `${timeline.reduce((sum, row) => sum + row.total, 0)} (24h)`,
        meta: `${health?.failedPlaybacks ?? 0} failed (7d window)`,
      },
      {
        title: "Active Schedules",
        value: String(health?.activeSchedules ?? 0),
        icon: TrendingUp,
        trend: `${health?.failedSchedules ?? 0} past due`,
        meta: "Derived from schedule windows",
      },
      {
        title: "Peak Hour",
        value: peakHour,
        icon: CheckCircle,
        trend: "last 24h",
        meta: "From playback timeline",
      },
    ];
  }, [health, timeline, peakHour]);

  const systemOnline = (health?.onlinePlayers ?? 0) > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-50">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-950 tracking-tight">Analytics</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Live metrics from system health and playback timeline (refreshes every 30s)
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                <div
                  className={cn(
                    "w-1 h-1 rounded-full",
                    systemOnline ? "bg-green-600" : "bg-gray-400",
                  )}
                />
                <span className="text-gray-600 font-medium">
                  {systemOnline ? "Players online" : "Awaiting heartbeats"}
                </span>
              </div>

              <div className="relative">
                <select
                  disabled
                  className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none appearance-none pr-8 opacity-70"
                  value="live"
                >
                  <option value="live">Live (API)</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <div className="px-8 py-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading analytics…</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {kpiCards.map((stat, i) => (
                  <div
                    key={i}
                    className="group bg-white border border-gray-100 rounded-lg p-3 transition-all hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-tight leading-tight">
                          {stat.title}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded flex items-center justify-center ml-1 flex-shrink-0 group-hover:bg-[#F3EEFF] transition-colors">
                        <stat.icon size={13} className="text-[#6B46FF]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="text-xl font-bold text-gray-950 leading-tight">{stat.value}</h3>
                        <span className="text-xs font-medium text-gray-500">{stat.trend}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">{stat.meta}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-lg p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-950 leading-tight">
                      Playback Outcomes
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">7-day system health breakdown</p>
                  </div>
                  <div className="h-60 flex items-center justify-center">
                    {engagementData.length === 0 ? (
                      <p className="text-sm text-gray-400">No playback data yet</p>
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

                <div className="bg-white border border-gray-100 rounded-lg p-5">
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-950 leading-tight">
                      Traffic Patterns
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Hourly playback volume (24h)</p>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hourlyTraffic}
                        margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                      >
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
                        <Bar dataKey="engaged" stackId="a" fill="#A473FF" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="deep" stackId="a" fill="#7C56E6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="moderate" stackId="a" fill="#C4B3FF" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="light" stackId="a" fill="#EDEBFF" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-950">Hourly Activity</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Broadcast count per hour</p>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#a1a5af" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#a1a5af" }} />
                      <RechartsTooltip />
                      <Bar dataKey="broadcasts" fill="#6B46FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-sm font-semibold text-gray-950">Playback Verification</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Timeline buckets with activity</p>
                </div>

                <div className="overflow-x-auto">
                  {playbackLogs.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-gray-400 text-center">
                      No playback events in the last 24 hours.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">File</th>
                          <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Device</th>
                          <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Duration</th>
                          <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Session</th>
                          <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playbackLogs.map((log) => (
                          <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                                    log.status === "Completed"
                                      ? "bg-emerald-100"
                                      : log.status === "Playing"
                                        ? "bg-blue-50"
                                        : "bg-red-50",
                                  )}
                                >
                                  <log.icon
                                    size={14}
                                    className={cn(
                                      log.status === "Completed"
                                        ? "text-emerald-700"
                                        : log.status === "Playing"
                                          ? "text-blue-600"
                                          : "text-red-600",
                                    )}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{log.file}</p>
                                  <p className="text-xs text-gray-500">{log.location}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-2.5">
                              <p className="text-gray-700 text-xs font-medium">{log.device}</p>
                            </td>
                            <td className="px-5 py-2.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                                  log.status === "Completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : log.status === "Playing"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-red-50 text-red-700",
                                )}
                              >
                                {log.status === "Completed" ? "Successful" : log.status}
                              </span>
                            </td>
                            <td className="px-5 py-2.5">
                              <p className="text-gray-600 text-xs">{log.duration}</p>
                            </td>
                            <td className="px-5 py-2.5">
                              <p className="text-gray-500 text-xs font-mono">{log.sessionId}</p>
                            </td>
                            <td className="px-5 py-2.5">
                              <p className="text-gray-600 text-xs whitespace-nowrap">{log.time}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
