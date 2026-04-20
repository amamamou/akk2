"use client";

import React from "react";
import { cn } from "@/utils/cn";

// small visual for audio items: compact, gradient-backed waveform bars
export default function AudioVisual({
  size = 40,
  color = "indigo",
}: {
  size?: number;
  color?: string;
}) {
  // static mapping so Tailwind doesn't purge dynamic classes
  const gradientMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-700",
    blue: "from-blue-500 to-blue-700",
    purple: "from-purple-500 to-purple-700",
    emerald: "from-emerald-500 to-emerald-700",
    slate: "from-slate-400 to-slate-600",
  };

  const gradient = gradientMap[color] || gradientMap.indigo;
  const bars = [4, 8, 5, 7, 3];

  return (
    <div
      className={cn(`flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br ${gradient}`)}
      style={{ width: size, height: size }}
    >
      <div className="flex items-end gap-[2px] opacity-80">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-[2px] bg-white rounded"
            style={{ height: `${h * (size / 40)}px` }}
          />
        ))}
      </div>
    </div>
  );
}
