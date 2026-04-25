"use client";
import React, { useMemo } from "react";

type WaveformProps = {
  progress: number; // 0-100
  isPlaying: boolean;
};

// Minimal, premium waveform: 12 bars, symmetric curve, subtle animation
const BAR_COUNT = 12;

export default function Waveform({ progress = 0, isPlaying = false }: WaveformProps) {
  // Precompute a smooth symmetric profile: center taller, edges smaller.
  const bars = useMemo(() => {
    const center = (BAR_COUNT - 1) / 2;
    return Array.from({ length: BAR_COUNT }, (_, index) => {
      const distance = Math.abs(index - center);
      const normalized = distance / center; // 0 at center -> 1 at edge
      // Smooth curve: higher in center, smaller at edges. Controlled, no randomness.
      const heightFactor = 0.48 + 0.52 * (1 - normalized * normalized); // ~0.48 - 1.0
      return { index, heightFactor };
    });
  }, []);

  const clamped = Math.max(0, Math.min(100, progress));
  const playedCount = Math.round((clamped / 100) * bars.length);

  const animation = isPlaying
    ? {
        animationName: "wfPulse",
        animationDuration: "2.8s",
        animationTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
        animationIterationCount: "infinite" as const,
      }
    : { animationName: "none" };

  // Render: premium waveform with minimal background (no gray slab).
  // Use currentColor for the played bars and a low-opacity currentColor for unplayed.
  return (
    <div className="h-2.5 w-full flex items-end gap-1" aria-hidden="true">
      {bars.map((bar, i) => {
        const isPlayed = i < playedCount;
        const alpha = isPlayed ? 1 : 0.25;

        return (
          <div
            key={bar.index}
            className="w-0.5 rounded-sm"
            style={{
              height: `${bar.heightFactor * 100}%`,
              transformOrigin: "center bottom",
              backgroundColor: "currentColor",
              opacity: alpha,
              // allow the surrounding text-color to tint the waveform if desired
              // (you can set a color on the parent to theme it)
              ...animation,
            }}
          />
        );
      })}
    </div>
  );
}
