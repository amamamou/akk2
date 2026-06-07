"use client";

import React from "react";

import type { ElementType } from "react";

type Stat = {
  title: string;
  value: string;
  icon: ElementType;
  trend?: string;
  meta?: string;
};

export default function KpiGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="group bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-tight leading-tight">
                {stat.title}
              </p>
            </div>
            <div className="w-6 h-6 rounded flex items-center justify-center ml-1 flex-shrink-0 group-hover:bg-[#F3EEFF] transition-colors">
              {(() => {
                const Icon = stat.icon as ElementType;
                return <Icon size={13} className="text-[#6B46FF]" />;
              })()}
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
  );
}
