"use client";

import React, { useState } from "react";
import { Music } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Playlist } from "@/app/library/components/PlaylistModal";
import { resolveCoverGradient } from "./playlist-cover-utils";

function hasCustomCover(cover?: string | null): boolean {
  if (!cover?.trim()) return false;
  return (
    cover.startsWith("http://") ||
    cover.startsWith("https://") ||
    cover.startsWith("data:") ||
    cover.startsWith("/")
  );
}

/** Clean cover art — image alone when uploaded; gradient + icon fallback only. */
export default function PlaylistCoverArt({
  playlist,
  className,
}: {
  playlist: Pick<Playlist, "cover" | "coverColor">;
  className?: string;
}) {
  const [coverError, setCoverError] = useState(false);
  const customCover = hasCustomCover(playlist.cover) && !coverError;
  const gradientClass = resolveCoverGradient(playlist.coverColor);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200/80 dark:bg-zinc-800 dark:ring-zinc-700/60",
        !customCover && "bg-gradient-to-br",
        !customCover && gradientClass,
        className
      )}
      aria-hidden
    >
      {customCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playlist.cover}
          alt=""
          onError={() => setCoverError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Music size={20} className="text-white/85" strokeWidth={1.75} />
        </div>
      )}
    </div>
  );
}
