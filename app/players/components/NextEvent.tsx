import React from "react";
import { Clock } from "lucide-react";

type NextEvt = { id: string; title: string; time?: string } | null;

export default function NextEvent({ evt }: { evt: NextEvt }) {
  if (!evt) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500">
        <Clock size={12} className="opacity-60" />
        <span>No upcoming events</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <Clock size={12} className="text-gray-500 opacity-70" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Next event
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-gray-900">
          {evt.time ?? ""}
        </span>
        <span className="line-clamp-2 text-xs font-medium text-gray-600">
          {evt.title}
        </span>
      </div>
    </div>
  );
}
