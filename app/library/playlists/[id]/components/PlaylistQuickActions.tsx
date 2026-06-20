"use client";

import React from "react";
import Link from "next/link";
import {
  Library,
  ListMusic,
  Pencil,
  Plus,
  Radio,
} from "lucide-react";
import {
  dashboardCardClass,
  dashboardIconChip,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

const actionClass =
  "group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#A473FF]/5 dark:hover:bg-[#A473FF]/10";

export default function PlaylistQuickActions({
  onAddTracks,
  onEdit,
}: {
  onAddTracks: () => void;
  onEdit: () => void;
}) {
  const links = [
    {
      type: "button" as const,
      label: "Add audio",
      icon: Plus,
      onClick: onAddTracks,
    },
    {
      type: "button" as const,
      label: "Edit playlist",
      icon: Pencil,
      onClick: onEdit,
    },
    {
      type: "link" as const,
      label: "Create playlist",
      icon: ListMusic,
      href: "/library/playlists",
    },
    {
      type: "link" as const,
      label: "Create player",
      icon: Radio,
      href: "/players",
    },
    {
      type: "link" as const,
      label: "Go to library",
      icon: Library,
      href: "/library",
    },
  ];

  return (
    <aside className={cn(dashboardCardClass, "p-5")}>
      <p className={dashboardSectionLabel}>Quick actions</p>
      <ul className="mt-3 space-y-0.5">
        {links.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <span className={cn(dashboardIconChip, "h-8 w-8 rounded-lg")}>
                <Icon
                  size={15}
                  strokeWidth={1.9}
                  className="text-gray-500 transition-colors group-hover:text-[#8B5CF6]"
                />
              </span>
              <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-gray-950 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                {item.label}
              </span>
            </>
          );

          return (
            <li key={item.label}>
              {item.type === "button" ? (
                <button type="button" onClick={item.onClick} className={actionClass}>
                  {content}
                </button>
              ) : (
                <Link href={item.href} className={actionClass}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
