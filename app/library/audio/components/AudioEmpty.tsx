import React from "react";

function EmptyWaveform({ size = 160 }: { size?: number }) {
  const barCount = 9;
  const width = size;
  const height = 24; // slimmer height for subtle appearance
  const gap = 6;
  // make bars much thinner for a minimalist look
  const barWidth = Math.max(2, Math.floor(size * 0.03));
  const center = (barCount - 1) / 2;

  // generate subtle symmetric heights (percent of total height)
  const heights = Array.from({ length: barCount }, (_, i) => {
    const d = Math.abs(i - center);
    const normalized = 1 - d / center; // 0..1
    const min = 0.28;
    const max = 0.9;
    return Math.round((min + (max - min) * normalized) * height);
  });

  // compute starting X to center the bars
  const totalBarsWidth = barCount * barWidth + (barCount - 1) * gap;
  const startX = Math.max(0, Math.floor((width - totalBarsWidth) / 2));

  return (
    <div style={{ width: size }} className="flex items-center justify-center text-gray-400">
      <svg width={size} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        {heights.map((h, i) => {
          const x = startX + i * (barWidth + gap);
          const y = height - h;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={1}
              fill="currentColor"
              fillOpacity={0.45}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function AudioEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-0">
      <EmptyWaveform size={120} />
      <h2 className="mt-3 text-base font-medium text-gray-600">No audio found</h2>
    </div>
  );
}
