"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  dashboardHeroSectionClass,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

export default function UploadWorkflowHero({ fileCount }: { fileCount: number }) {
  return (
    <section className={dashboardHeroSectionClass}>
      <Link
        href="/library/audio"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[#8B5CF6] dark:text-zinc-400 dark:hover:text-[#A473FF]"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to audio library
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className={dashboardSectionLabel}>Library · Import</p>
          <h1 className={cn(dashboardPanelTitle, "text-[32px] font-semibold sm:text-[36px]")}>
            Upload audio
          </h1>
          <p className={cn(dashboardPanelSubtitle, "max-w-xl text-sm")}>
            Import files, review details, and add them to your library for playlists and
            broadcasts.
          </p>
        </div>

        {fileCount > 0 && (
          <div className="text-sm text-gray-500 dark:text-zinc-400">
            <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
              {fileCount}
            </span>{" "}
            {fileCount === 1 ? "file" : "files"} ready to import
          </div>
        )}
      </div>
    </section>
  );
}
