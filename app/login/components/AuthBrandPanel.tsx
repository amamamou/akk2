"use client";

import Image from "next/image";
import { BarChart3, ListMusic, Radio } from "lucide-react";
import { dashboardBrandGradient, dashboardSectionLabel } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

const FEATURES = [
  {
    icon: ListMusic,
    title: "Playlists",
    desc: "Curate the perfect soundtrack for every location.",
  },
  {
    icon: Radio,
    title: "Live players",
    desc: "Monitor and control devices in real time.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Insights across clients, zones, and uptime.",
  },
] as const;

const EQUALIZER_BARS = [0.35, 0.65, 0.45, 0.85, 0.55, 0.75, 0.4, 0.7, 0.5, 0.6];

export default function AuthBrandPanel() {
  return (
    <div className="relative hidden min-h-screen flex-col overflow-hidden bg-[#09090C] lg:flex lg:w-[52%] xl:w-[55%]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(circle, #A473FF 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-[320px] w-[320px] rounded-full opacity-25 blur-[90px]"
        style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 70%)" }}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 p-1.5 shadow-[0_8px_32px_rgba(164,115,255,0.25)]">
            <Image
              src="/akousticarts.webp"
              alt="Akoustic Arts"
              width={36}
              height={36}
              className="rounded-lg object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">Akoustic Arts</p>
            <p className={cn(dashboardSectionLabel, "text-zinc-500")}>Workspace platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <p
              className={cn(
                dashboardSectionLabel,
                "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-zinc-400"
              )}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#A473FF] shadow-[0_0_8px_rgba(164,115,255,0.8)]" />
              Audio operations hub
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-[2.75rem]">
              Sound.
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: dashboardBrandGradient }}
              >
                Curated.
              </span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-zinc-400">
              Manage audio assets, playlists, and live players across every client workspace — from
              one calm, powerful dashboard.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:border-[#A473FF]/20 hover:bg-white/[0.05]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#A473FF]/10 ring-1 ring-[#A473FF]/15">
                  <Icon size={16} className="text-[#A473FF]" strokeWidth={2} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-zinc-100">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Equalizer */}
          <div className="flex h-10 items-end gap-1 opacity-60" aria-hidden>
            {EQUALIZER_BARS.map((delay, i) => (
              <span
                key={i}
                className="w-1 origin-bottom rounded-full bg-gradient-to-t from-[#202538] to-[#A473FF]"
                style={{
                  height: `${28 + i * 3}%`,
                  animation: `equalizer-bar 0.65s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-600">© 2026 Akoustic Arts. All rights reserved.</p>
      </div>
    </div>
  );
}
