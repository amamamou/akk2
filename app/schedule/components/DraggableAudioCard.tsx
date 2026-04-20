"use client";
import React from "react";
import { useDrag } from "react-dnd";
import { PlayCircle, GripVertical, Pause } from "lucide-react";
import { cn } from "../../../utils/cn";

type AudioItem = { id: string; title: string; duration: number; type: string };
const ITEM_TYPES = { AUDIO: "audio" };

export default function DraggableAudioCard({ audio, onPreview, isPreviewing }: { audio: AudioItem; onPreview?: (id: string) => void; isPreviewing?: boolean }) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPES.AUDIO,
    item: { ...audio },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div
      ref={(el) => (dragRef as unknown as (instance: HTMLDivElement | null) => void)(el)}
      className={cn(
        "flex items-center gap-3 flex-shrink-0 rounded-md bg-white border border-transparent hover:bg-gray-50 hover:border-gray-100 px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition transform duration-150 min-w-[220px]",
        isDragging ? "opacity-60 scale-95 shadow-lg" : ""
      )}
    >
      <div className="text-gray-400">
        <GripVertical size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); onPreview?.(audio.id); }} className="p-1 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100">
              {isPreviewing ? <Pause size={16} /> : <PlayCircle size={16} />}
            </button>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{audio.title}</div>
              <div className="text-xs text-gray-500 truncate">{audio.type}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{audio.duration}m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
