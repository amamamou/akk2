"use client";

import React from "react";

export function PlayersWorkspaceHeading({
  name,
  count,
}: {
  name: string;
  count: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1 pb-2">
      <h2 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{name}</h2>
      <span className="shrink-0 text-xs tabular-nums text-gray-400">
        {count} {count === 1 ? "player" : "players"}
      </span>
    </div>
  );
}

export default function PlayersListHeader() {
  return (
    <div
      className="hidden border-b border-gray-100 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:border-zinc-800 sm:grid sm:grid-cols-[36px_1fr_minmax(0,9rem)_minmax(0,7rem)_auto] sm:gap-4 sm:px-6"
      aria-hidden
    >
      <span />
      <span>Name</span>
      <span className="truncate">Playback</span>
      <span className="truncate">Playlist</span>
      <span />
    </div>
  );
}
