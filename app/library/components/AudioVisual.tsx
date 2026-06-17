"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { Play, Pause, AlertCircle } from "lucide-react";

const gradientMap: Record<string, string> = {
  indigo: "from-indigo-500 to-indigo-700",
  blue: "from-blue-500 to-blue-700",
  purple: "from-purple-500 to-purple-700",
  emerald: "from-emerald-500 to-emerald-700",
  slate: "from-slate-400 to-slate-600",
};

export default function AudioVisual({
  size = 40,
  color = "indigo",
  src,
  onPlay,
  loop = false,
  isPlaying: isPlayingProp,
  onPlayToggle,
  hasStreamError = false,
}: {
  size?: number;
  color?: string;
  src?: string;
  onPlay?: () => void;
  loop?: boolean;
  /** Controlled playback — parent owns the `<audio>` element. */
  isPlaying?: boolean;
  onPlayToggle?: (e: React.MouseEvent) => void;
  hasStreamError?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const controlled = onPlayToggle != null;
  const playing = controlled ? !!isPlayingProp : localPlaying;

  useEffect(() => {
    if (controlled) return;
    const a = audioRef.current;
    if (!a) return;
    a.loop = loop;
    const onEnded = () => {
      if (!loop) setLocalPlaying(false);
    };
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [loop, controlled]);

  const bars = [4, 8, 5, 7, 3];
  const isHex = typeof color === "string" && color.startsWith("#");
  const gradient = !isHex ? gradientMap[color] || gradientMap.indigo : undefined;
  const bgClass = isHex ? "" : `bg-gradient-to-br ${gradient}`;

  const style: React.CSSProperties = {
    width: size,
    height: size,
    ...(isHex ? { background: color } : {}),
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlled) {
      onPlayToggle?.(e);
      return;
    }
    if (src) {
      const a = audioRef.current;
      if (!a) return;
      if (localPlaying) {
        a.pause();
        setLocalPlaying(false);
      } else {
        void a.play().catch(() => setLocalPlaying(false));
        setLocalPlaying(true);
      }
    } else {
      onPlay?.();
    }
  };

  return (
    <div
      className={cn(
        "group relative flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center",
        bgClass,
        hasStreamError && "ring-2 ring-amber-400/80"
      )}
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

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={handleClick}
          aria-label={hasStreamError ? "Playback unavailable" : playing ? "Pause" : "Play"}
          className={cn(
            "transition-opacity duration-150 bg-white/90 hover:bg-white rounded-full p-1 shadow flex items-center justify-center",
            hasStreamError
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          {hasStreamError ? (
            <AlertCircle size={14} className="text-amber-600" />
          ) : playing ? (
            <Pause size={14} />
          ) : (
            <Play size={14} />
          )}
        </button>
      </div>

      {!controlled && src && (
        <audio ref={audioRef} src={src} className="hidden" loop={loop} />
      )}
    </div>
  );
}
