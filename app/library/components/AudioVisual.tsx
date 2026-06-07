"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { Play, Pause } from "lucide-react";

// small visual for audio items: compact, gradient-backed waveform bars
export default function AudioVisual({
  size = 40,
  color = "indigo",
  src,
  onPlay,
  loop = false,
}: {
  size?: number;
  color?: string;
  src?: string;
  onPlay?: () => void;
  /** When true, HTML audio loops continuously (preview / player runtime). */
  loop?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = loop;
    const onEnded = () => {
      if (!loop) setPlaying(false);
    };
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [loop]);
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
      className={cn(`group relative flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center ${bgClass}`)}
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

      {/* Hover overlay with play/pause control */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (src) {
              const a = audioRef.current;
              if (!a) return;
              if (playing) {
                a.pause();
                setPlaying(false);
              } else {
                a.play().catch(() => {});
                setPlaying(true);
              }
            } else {
              onPlay?.();
            }
          }}
          aria-label={playing ? "Pause" : "Play"}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-white/90 hover:bg-white rounded-full p-1 shadow flex items-center justify-center"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {src && <audio ref={audioRef} src={src} className="hidden" loop={loop} />}
    </div>
  );
}