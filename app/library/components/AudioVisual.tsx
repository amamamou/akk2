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

  const bars = [4, 8, 5, 7, 3];

  // allow passing a hex color (e.g. '#7318FF') and fall back to preset gradients
  const isHex = typeof color === "string" && color.startsWith("#");
  const gradient = !isHex ? gradientMap[color] || gradientMap.indigo : undefined;
  const bgClass = isHex ? "" : `bg-gradient-to-br ${gradient}`;

  const style: React.CSSProperties = {
    width: size,
    height: size,
    ...(isHex ? { background: color } : {}),
  };

  return (
    <div
      className={cn(`flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center ${bgClass}`)}
      style={style}
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
