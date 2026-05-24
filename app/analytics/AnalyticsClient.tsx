"use client";

import React, { useState, useMemo } from "react";
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
import { PlayCircle, Clock, CheckCircle, AlertCircle, ChevronDown, TrendingUp, Users, Activity } from "lucide-react";
import type { PieLabelRenderProps } from "recharts";
import { cn } from "@/utils/cn";

type PlayerType = "all" | "alpha" | "bravo" | "charlie" | "delta";

interface PlayerMetadata {
  status: "online" | "offline";
  device: string;
  lastActive: string;
}

// Listener Engagement Tiers for Global View
// Player-specific metrics - ALWAYS same segmentation structure
interface PlayerMetrics {
  totalListeners: number;
  engagedListeners: number;
  lightListeners: number;
  moderateListeners: number;
  deepListeners: number;
  retentionRate: string;
  engagementTrend: string;
}

interface HourlyTrafficData {
  hour: string;
  engaged: number;
  deep: number;
  moderate: number;
  light: number;
}

interface PlayerData {
  stats: {
    broadcasts: number;
    listeningTime: string;
    successRate: string;
    failedPlays: number;
    trend: string;
    activePlayers?: number;
    avgSessionDuration: string;
    uptime: string;
    peakActivityHour: string;
  };
  metadata: PlayerMetadata;
  listenerSegmentation: PlayerMetrics;
  hourlyTraffic: HourlyTrafficData[];
  engagementData: Array<{ id: string; segment: string; count: number }>;
  activityData: Array<{ id: string; time: string; broadcasts: number }>;
  heatmapData: Array<{ id: string; name: string; total: number; failed: number }>;
    logs: Array<{
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
    lastHeartbeat?: string;
  }>;
}

// Player-specific datasets
const playerData: Record<PlayerType, PlayerData> = {
  all: {
    stats: {
      broadcasts: 180,
      listeningTime: "324h",
      successRate: "98.5%",
      failedPlays: 3,
      trend: "+12.5%",
      activePlayers: 4,
      avgSessionDuration: "47m",
      uptime: "99.8%",
      peakActivityHour: "14:00",
    },
    metadata: { status: "online", device: "Multi-device", lastActive: "Now" },
    listenerSegmentation: {
      totalListeners: 2847,
      engagedListeners: 623,
      deepListeners: 342,
      moderateListeners: 891,
      lightListeners: 991,
      engagementTrend: "+8.3%",
      retentionRate: "76.2%",
    },
    hourlyTraffic: [
      { hour: "08:00", engaged: 145, deep: 78, moderate: 201, light: 287 },
      { hour: "09:00", engaged: 178, deep: 92, moderate: 256, light: 318 },
      { hour: "10:00", engaged: 156, deep: 81, moderate: 224, light: 295 },
      { hour: "11:00", engaged: 189, deep: 98, moderate: 271, light: 312 },
      { hour: "12:00", engaged: 134, deep: 69, moderate: 192, light: 267 },
      { hour: "13:00", engaged: 201, deep: 104, moderate: 287, light: 334 },
      { hour: "14:00", engaged: 223, deep: 116, moderate: 318, light: 356 },
      { hour: "15:00", engaged: 167, deep: 87, moderate: 239, light: 298 },
      { hour: "16:00", engaged: 190, deep: 99, moderate: 272, light: 321 },
    ],
    engagementData: [
      { id: "e1", segment: "Deep", count: 342 },
      { id: "e2", segment: "Moderate", count: 891 },
      { id: "e3", segment: "Light", count: 991 },
      { id: "e4", segment: "Engaged", count: 623 },
    ],
    activityData: [
      { id: "act1", time: "08:00", broadcasts: 4 },
      { id: "act2", time: "09:00", broadcasts: 7 },
      { id: "act3", time: "10:00", broadcasts: 5 },
      { id: "act4", time: "11:00", broadcasts: 6 },
      { id: "act5", time: "12:00", broadcasts: 2 },
      { id: "act6", time: "13:00", broadcasts: 8 },
      { id: "act7", time: "14:00", broadcasts: 9 },
      { id: "act8", time: "15:00", broadcasts: 4 },
      { id: "act9", time: "16:00", broadcasts: 7 },
    ],
    heatmapData: [
      { id: "heat1", name: "Yoga Studio", total: 42, failed: 1 },
      { id: "heat2", name: "Lobby", total: 68, failed: 0 },
      { id: "heat3", name: "Therapy Room", total: 15, failed: 2 },
      { id: "heat4", name: "Retail Floor", total: 55, failed: 0 },
    ],
    logs: [
      { id: "log1", time: "10:05 AM", file: "Morning Flow (60m)", location: "Yoga Studio", status: "Completed", icon: CheckCircle, device: "Player 1 • Android", latency: "24ms", duration: "60m", quality: "HD", sessionId: "sess-001", lastHeartbeat: "now" },
      { id: "log2", time: "09:30 AM", file: "Lobby Ambience", location: "Lobby", status: "Playing", icon: PlayCircle, device: "Player 2 • iOS", latency: "18ms", duration: "ongoing", quality: "HD", sessionId: "sess-002", lastHeartbeat: "5s ago" },
      { id: "log3", time: "09:00 AM", file: "Therapy Binaural", location: "Therapy Room", status: "Failed", icon: AlertCircle, device: "Player 3 • Web", latency: "156ms", duration: "2m", quality: "SD", sessionId: "sess-003", lastHeartbeat: "25m ago" },
      { id: "log4", time: "08:00 AM", file: "Morning Flow (60m)", location: "Yoga Studio", status: "Completed", icon: CheckCircle, device: "Player 4 • Android", latency: "32ms", duration: "60m", quality: "HD", sessionId: "sess-004", lastHeartbeat: "2h ago" },
    ],
  },
  alpha: {
    stats: {
      broadcasts: 52,
      listeningTime: "98h",
      successRate: "99.2%",
      failedPlays: 0,
      trend: "+8.3%",
      activePlayers: 1,
      avgSessionDuration: "52m",
      uptime: "99.9%",
      peakActivityHour: "14:30",
    },
    metadata: { status: "online", device: "Android", lastActive: "2 min ago" },
    listenerSegmentation: {
      totalListeners: 612,
      engagedListeners: 156,
      lightListeners: 198,
      moderateListeners: 175,
      deepListeners: 83,
      engagementTrend: "+9.2%",
      retentionRate: "82.1%",
    },
    hourlyTraffic: [
      { hour: "08:00", engaged: 32, deep: 15, moderate: 42, light: 58 },
      { hour: "09:00", engaged: 38, deep: 19, moderate: 48, light: 67 },
      { hour: "10:00", engaged: 35, deep: 18, moderate: 41, light: 62 },
      { hour: "11:00", engaged: 42, deep: 21, moderate: 52, light: 71 },
      { hour: "12:00", engaged: 29, deep: 14, moderate: 36, light: 54 },
      { hour: "13:00", engaged: 45, deep: 23, moderate: 55, light: 78 },
      { hour: "14:00", engaged: 51, deep: 26, moderate: 63, light: 85 },
      { hour: "15:00", engaged: 38, deep: 19, moderate: 47, light: 68 },
      { hour: "16:00", engaged: 43, deep: 22, moderate: 53, light: 74 },
    ],
    engagementData: [
      { id: "e1", segment: "Deep", count: 83 },
      { id: "e2", segment: "Moderate", count: 175 },
      { id: "e3", segment: "Light", count: 198 },
      { id: "e4", segment: "Engaged", count: 156 },
    ],

    activityData: [
      { id: "act1", time: "08:00", broadcasts: 2 },
      { id: "act2", time: "09:00", broadcasts: 3 },
      { id: "act3", time: "10:00", broadcasts: 2 },
      { id: "act4", time: "11:00", broadcasts: 1 },
      { id: "act5", time: "12:00", broadcasts: 1 },
      { id: "act6", time: "13:00", broadcasts: 2 },
      { id: "act7", time: "14:00", broadcasts: 3 },
      { id: "act8", time: "15:00", broadcasts: 2 },
      { id: "act9", time: "16:00", broadcasts: 3 },
    ],
    heatmapData: [
      { id: "heat1", name: "Yoga Studio", total: 18, failed: 0 },
      { id: "heat2", name: "Lobby", total: 22, failed: 0 },
      { id: "heat3", name: "Therapy Room", total: 8, failed: 0 },
      { id: "heat4", name: "Retail Floor", total: 12, failed: 0 },
    ],
    logs: [
      { id: "log1", time: "10:05 AM", file: "Morning Flow (60m)", location: "Yoga Studio", status: "Completed", icon: CheckCircle, device: "Player Alpha • Android", latency: "22ms", duration: "60m", quality: "HD", sessionId: "sess-alpha-1", lastHeartbeat: "now" },
      { id: "log2", time: "09:30 AM", file: "Lobby Ambience", location: "Lobby", status: "Playing", icon: PlayCircle, device: "Player Alpha • Android", latency: "20ms", duration: "ongoing", quality: "HD", sessionId: "sess-alpha-2", lastHeartbeat: "3s ago" },
    ],
  },
  bravo: {
    stats: {
      broadcasts: 48,
      listeningTime: "87h",
      successRate: "97.9%",
      failedPlays: 1,
      trend: "+5.2%",
      activePlayers: 1,
      avgSessionDuration: "44m",
      uptime: "99.6%",
      peakActivityHour: "13:45",
    },
    metadata: { status: "online", device: "iOS", lastActive: "5 min ago" },
    listenerSegmentation: {
      totalListeners: 548,
      engagedListeners: 124,
      lightListeners: 172,
      moderateListeners: 156,
      deepListeners: 96,
      engagementTrend: "+6.1%",
      retentionRate: "78.5%",
    },
    hourlyTraffic: [
      { hour: "08:00", engaged: 28, deep: 18, moderate: 35, light: 48 },
      { hour: "09:00", engaged: 32, deep: 21, moderate: 40, light: 56 },
      { hour: "10:00", engaged: 29, deep: 19, moderate: 37, light: 52 },
      { hour: "11:00", engaged: 35, deep: 23, moderate: 44, light: 61 },
      { hour: "12:00", engaged: 24, deep: 16, moderate: 31, light: 44 },
      { hour: "13:00", engaged: 38, deep: 25, moderate: 47, light: 67 },
      { hour: "14:00", engaged: 42, deep: 28, moderate: 52, light: 73 },
      { hour: "15:00", engaged: 31, deep: 20, moderate: 40, light: 57 },
      { hour: "16:00", engaged: 37, deep: 24, moderate: 46, light: 65 },
    ],
    engagementData: [
      { id: "e1", segment: "Deep", count: 96 },
      { id: "e2", segment: "Moderate", count: 156 },
      { id: "e3", segment: "Light", count: 172 },
      { id: "e4", segment: "Engaged", count: 124 },
    ],
    activityData: [
      { id: "act1", time: "08:00", broadcasts: 1 },
      { id: "act2", time: "09:00", broadcasts: 2 },
      { id: "act3", time: "10:00", broadcasts: 2 },
      { id: "act4", time: "11:00", broadcasts: 2 },
      { id: "act5", time: "12:00", broadcasts: 1 },
      { id: "act6", time: "13:00", broadcasts: 2 },
      { id: "act7", time: "14:00", broadcasts: 2 },
      { id: "act8", time: "15:00", broadcasts: 1 },
      { id: "act9", time: "16:00", broadcasts: 2 },
    ],
    heatmapData: [
      { id: "heat1", name: "Yoga Studio", total: 12, failed: 1 },
      { id: "heat2", name: "Lobby", total: 18, failed: 0 },
      { id: "heat3", name: "Therapy Room", total: 5, failed: 0 },
      { id: "heat4", name: "Retail Floor", total: 13, failed: 0 },
    ],
    logs: [
      { id: "log1", time: "10:05 AM", file: "Therapy Binaural", location: "Therapy Room", status: "Completed", icon: CheckCircle, device: "Player Bravo • iOS", latency: "19ms", duration: "45m", quality: "HD", sessionId: "sess-bravo-1", lastHeartbeat: "now" },
      { id: "log2", time: "09:30 AM", file: "Lobby Ambience", location: "Lobby", status: "Playing", icon: PlayCircle, device: "Player Bravo • iOS", latency: "17ms", duration: "ongoing", quality: "HD", sessionId: "sess-bravo-2", lastHeartbeat: "6s ago" },
      { id: "log3", time: "09:00 AM", file: "Therapy Binaural", location: "Therapy Room", status: "Failed", icon: AlertCircle, device: "Player Bravo • iOS", latency: "145ms", duration: "8m", quality: "SD", sessionId: "sess-bravo-3", lastHeartbeat: "1h ago" },
    ],
  },
  charlie: {
    stats: {
      broadcasts: 56,
      listeningTime: "102h",
      successRate: "98.2%",
      failedPlays: 1,
      trend: "+3.1%",
      activePlayers: 1,
      avgSessionDuration: "50m",
      uptime: "98.7%",
      peakActivityHour: "12:00",
    },
    metadata: { status: "offline", device: "Web", lastActive: "1 hour ago" },
    listenerSegmentation: {
      totalListeners: 687,
      engagedListeners: 187,
      lightListeners: 245,
      moderateListeners: 196,
      deepListeners: 59,
      engagementTrend: "+4.7%",
      retentionRate: "74.2%",
    },
    hourlyTraffic: [
      { hour: "08:00", engaged: 35, deep: 12, moderate: 48, light: 71 },
      { hour: "09:00", engaged: 42, deep: 14, moderate: 55, light: 82 },
      { hour: "10:00", engaged: 38, deep: 13, moderate: 50, light: 76 },
      { hour: "11:00", engaged: 48, deep: 16, moderate: 63, light: 92 },
      { hour: "12:00", engaged: 32, deep: 11, moderate: 42, light: 62 },
      { hour: "13:00", engaged: 51, deep: 17, moderate: 67, light: 99 },
      { hour: "14:00", engaged: 58, deep: 19, moderate: 76, light: 112 },
      { hour: "15:00", engaged: 44, deep: 15, moderate: 58, light: 85 },
      { hour: "16:00", engaged: 49, deep: 16, moderate: 64, light: 94 },
    ],
    engagementData: [
      { id: "e1", segment: "Deep", count: 59 },
      { id: "e2", segment: "Moderate", count: 196 },
      { id: "e3", segment: "Light", count: 245 },
      { id: "e4", segment: "Engaged", count: 187 },
    ],
    activityData: [
      { id: "act1", time: "08:00", broadcasts: 1 },
      { id: "act2", time: "09:00", broadcasts: 2 },
      { id: "act3", time: "10:00", broadcasts: 1 },
      { id: "act4", time: "11:00", broadcasts: 2 },
      { id: "act5", time: "12:00", broadcasts: 0 },
      { id: "act6", time: "13:00", broadcasts: 2 },
      { id: "act7", time: "14:00", broadcasts: 2 },
      { id: "act8", time: "15:00", broadcasts: 1 },
      { id: "act9", time: "16:00", broadcasts: 0 },
    ],
    heatmapData: [
      { id: "heat1", name: "Yoga Studio", total: 12, failed: 0 },
      { id: "heat2", name: "Lobby", total: 28, failed: 0 },
      { id: "heat3", name: "Therapy Room", total: 2, failed: 1 },
      { id: "heat4", name: "Retail Floor", total: 14, failed: 0 },
    ],
    logs: [
      { id: "log1", time: "10:05 AM", file: "Morning Flow (60m)", location: "Yoga Studio", status: "Completed", icon: CheckCircle, device: "Player Charlie • Web", latency: "28ms", duration: "60m", quality: "HD", sessionId: "sess-charlie-1", lastHeartbeat: "2d ago" },
    ],
  },
  delta: {
    stats: {
      broadcasts: 24,
      listeningTime: "37h",
      successRate: "95.8%",
      failedPlays: 1,
      trend: "-2.1%",
      activePlayers: 1,
      avgSessionDuration: "38m",
      uptime: "96.2%",
      peakActivityHour: "15:15",
    },
    metadata: { status: "online", device: "Android", lastActive: "10 min ago" },
    listenerSegmentation: {
      totalListeners: 400,
      engagedListeners: 86,
      lightListeners: 136,
      moderateListeners: 124,
      deepListeners: 54,
      engagementTrend: "+2.3%",
      retentionRate: "68.5%",
    },
    hourlyTraffic: [
      { hour: "08:00", engaged: 15, deep: 8, moderate: 28, light: 42 },
      { hour: "09:00", engaged: 18, deep: 9, moderate: 31, light: 48 },
      { hour: "10:00", engaged: 16, deep: 8, moderate: 27, light: 44 },
      { hour: "11:00", engaged: 22, deep: 11, moderate: 38, light: 58 },
      { hour: "12:00", engaged: 12, deep: 6, moderate: 21, light: 32 },
      { hour: "13:00", engaged: 25, deep: 13, moderate: 43, light: 66 },
      { hour: "14:00", engaged: 28, deep: 14, moderate: 48, light: 72 },
      { hour: "15:00", engaged: 20, deep: 10, moderate: 34, light: 52 },
      { hour: "16:00", engaged: 23, deep: 12, moderate: 39, light: 59 },
    ],
    engagementData: [
      { id: "e1", segment: "Deep", count: 54 },
      { id: "e2", segment: "Moderate", count: 124 },
      { id: "e3", segment: "Light", count: 136 },
      { id: "e4", segment: "Engaged", count: 86 },
    ],
    activityData: [
      { id: "act1", time: "08:00", broadcasts: 0 },
      { id: "act2", time: "09:00", broadcasts: 0 },
      { id: "act3", time: "10:00", broadcasts: 0 },
      { id: "act4", time: "11:00", broadcasts: 1 },
      { id: "act5", time: "12:00", broadcasts: 0 },
      { id: "act6", time: "13:00", broadcasts: 2 },
      { id: "act7", time: "14:00", broadcasts: 2 },
      { id: "act8", time: "15:00", broadcasts: 0 },
      { id: "act9", time: "16:00", broadcasts: 2 },
    ],
    heatmapData: [
      { id: "heat1", name: "Yoga Studio", total: 0, failed: 0 },
      { id: "heat2", name: "Lobby", total: 0, failed: 0 },
      { id: "heat3", name: "Therapy Room", total: 0, failed: 0 },
      { id: "heat4", name: "Retail Floor", total: 16, failed: 1 },
    ],
    logs: [
      { id: "log1", time: "10:05 AM", file: "Retail Audio Package", location: "Retail Floor", status: "Completed", icon: CheckCircle, device: "Player Delta • Android", latency: "35ms", duration: "24m", quality: "HD", sessionId: "sess-delta-1", lastHeartbeat: "now" },
      { id: "log2", time: "09:30 AM", file: "Retail Audio Package", location: "Retail Floor", status: "Playing", icon: PlayCircle, device: "Player Delta • Android", latency: "31ms", duration: "ongoing", quality: "HD", sessionId: "sess-delta-2", lastHeartbeat: "8s ago" },
      { id: "log3", time: "09:00 AM", file: "Retail Audio Package", location: "Retail Floor", status: "Failed", icon: AlertCircle, device: "Player Delta • Android", latency: "168ms", duration: "15m", quality: "SD", sessionId: "sess-delta-3", lastHeartbeat: "45m ago" },
    ],
  },
};

export default function AnalyticsClient() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerType>("all");
  const currentData = playerData[selectedPlayer];

  // Generate KPI data - ALWAYS same structure with values adapting per player
  const kpiCards = useMemo(() => {
    const seg = currentData.listenerSegmentation;
    return [
      { 
        title: "Total Listeners", 
        value: seg.totalListeners.toLocaleString(), 
        icon: Users,
        trend: seg.engagementTrend,
        meta: `Retention: ${seg.retentionRate}`
      },
      { 
        title: "Engaged Listeners", 
        value: seg.engagedListeners.toLocaleString(), 
        icon: Activity,
        trend: "+2.3%",
        meta: `${((seg.engagedListeners / seg.totalListeners) * 100).toFixed(1)}% of total`
      },
      { 
        title: "Light Listeners", 
        value: seg.lightListeners.toLocaleString(), 
        icon: Clock,
        trend: "+1.2%",
        meta: `Casual engagement`
      },
      { 
        title: "Moderate Listeners", 
        value: seg.moderateListeners.toLocaleString(), 
        icon: TrendingUp,
        trend: "+3.1%",
        meta: `Regular listeners`
      },
      { 
        title: "Deep Listeners", 
        value: seg.deepListeners.toLocaleString(), 
        icon: CheckCircle,
        trend: "+0.8%",
        meta: `Highest engagement`
      },
    ];
  }, [currentData.listenerSegmentation]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-50">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-950 tracking-tight">Analytics</h1>
              <p className="text-xs text-gray-500 mt-0.5">Playback verification and listening metrics</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Player Selector */}
              <div className="relative">
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value as PlayerType)}
                  className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200"
                >
                  <option value="all">All Players</option>
                  <option value="alpha">Player Alpha</option>
                  <option value="bravo">Player Bravo</option>
                  <option value="charlie">Player Charlie</option>
                  <option value="delta">Player Delta</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>

              {/* Player Status Badge */}
              {selectedPlayer !== "all" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                  <div className={cn("w-1 h-1 rounded-full", currentData.metadata.status === "online" ? "bg-green-600" : "bg-gray-400")} />
                  <span className="text-gray-600 font-medium">{currentData.metadata.status === "online" ? "Online" : "Offline"}</span>
                  <span className="text-gray-300 mx-0.5">•</span>
                  <span className="text-gray-500">{currentData.metadata.device}</span>
                </div>
              )}

              {/* Time Filter */}
              <div className="relative">
                <select className="border border-gray-100 rounded-lg text-sm px-3 py-1.5 bg-white text-gray-900 outline-none focus:border-gray-300 focus:ring-0 appearance-none pr-8 transition-colors hover:border-gray-200">
                  <option>Today</option>
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="px-8 py-6 space-y-6">
          {/* KPI Grid - 5 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {kpiCards.map((stat, i) => (
              <div 
                key={i} 
                className="group bg-white border border-gray-100 rounded-lg p-3 transition-all hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-tight leading-tight">{stat.title}</p>
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

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Listener Distribution Donut Chart */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-950 leading-tight">Listener Distribution</h3>
                <p className="text-xs text-gray-500 mt-0.5">Engagement tier segmentation</p>
              </div>
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentData.engagementData}
                      nameKey="segment"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={1.5}
                      dataKey="count"
                      label={(props: PieLabelRenderProps) => `${props.name} ${(props.percent ? (props.percent * 100).toFixed(0) : "0")}%`}
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
              </div>
            </div>

            {/* Traffic Patterns - Hourly Distribution */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-950 leading-tight">Traffic Patterns</h3>
                <p className="text-xs text-gray-500 mt-0.5">Hourly listener activity by engagement tier</p>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={currentData.hourlyTraffic}
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

          {/* Playback Log */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-sm font-semibold text-gray-950">Playback Verification</h3>
              <p className="text-xs text-gray-500 mt-0.5">Recent broadcast activity and performance metrics</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">File</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Device</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Latency</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Duration</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Quality</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Session</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-700 text-xs uppercase tracking-wide">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                            log.status === "Completed" ? "bg-emerald-100" : 
                              log.status === "Playing" ? "bg-blue-50" : "bg-red-50"
                          )}>
                              <log.icon size={14} className={cn(
                                log.status === "Completed" ? "text-emerald-700" :
                                log.status === "Playing" ? "text-blue-600" : "text-red-600"
                              )} />
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
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                          log.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                          log.status === "Playing" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            log.status === "Completed" ? "bg-emerald-600" :
                            log.status === "Playing" ? "bg-blue-600" : "bg-red-600"
                          )} />
                          {log.status === "Completed" ? "Successful" : log.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <p className="text-gray-600 text-xs font-mono">{log.latency}</p>
                      </td>
                      <td className="px-5 py-2.5">
                        <p className="text-gray-600 text-xs">{log.duration}</p>
                      </td>
                      <td className="px-5 py-2.5">
                        <p className="text-gray-600 text-xs font-medium">{log.quality}</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
