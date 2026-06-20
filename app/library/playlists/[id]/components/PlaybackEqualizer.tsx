"use client";

import React from "react";
import { cn } from "@/utils/cn";

const BAR_COUNT = 4;

/** Compact equalizer for embedding inside the playback button. */
export default function PlaybackEqualizer({
  active,
  barClassName,
  className,
  size = "md",
}: {
  active: boolean;
  barClassName?: string;
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  const height = size === "xs" ? 10 : size === "sm" ? 14 : 18;
  const width = size === "xs" ? 2 : size === "sm" ? 2 : 2.5;

  return (
    <div className={cn("flex items-end justify-center gap-[2px]", className)} aria-hidden>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span
          key={i}
          className={cn(
            "origin-bottom rounded-full",
            barClassName ?? "bg-white",
            active && "animate-equalizer-bar"
          )}
          style={{
            width,
            height: active ? height : Math.max(3, height * 0.35),
            animationDelay: active ? `${i * 0.08}s` : undefined,
            animationDuration: active ? `${0.5 + (i % 2) * 0.15}s` : undefined,
            opacity: active ? 0.9 : 0.35,
          }}
        />
      ))}
    </div>
  );
}
