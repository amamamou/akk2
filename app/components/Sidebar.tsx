"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  SunDim,
  MoonStar,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Speaker,
  ListMusic,
  BarChart3,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-[76px] h-full bg-[#F4F4F5] flex flex-col items-center py-4">

      {/* TOP CAPSULE */}
      <div className="bg-white rounded-full px-2 py-2 flex flex-col items-center gap-2">
        <SidebarButton
          icon={<SunDim size={16} strokeWidth={1.9} />}
        />

        <SidebarButton
          icon={<MoonStar size={16} strokeWidth={1.9} />}
        />
      </div>

      {/* CENTER CAPSULE */}
      <div className="mt-6 bg-white rounded-full px-2.5 py-3 flex flex-col items-center gap-2">
        <SidebarButton
          href="/dashboard"
          icon={<LayoutDashboard size={15} strokeWidth={1.9} />}
        />

        <SidebarButton
          href="/schedule"
          icon={<CalendarDays size={15} strokeWidth={1.9} />}
        />

        <SidebarButton
          href="/players"
          icon={<Speaker size={15} strokeWidth={1.9} />}
        />

        <SidebarButton
          href="/library/playlists"
          icon={<ListMusic size={15} strokeWidth={1.9} />}
        />

        <SidebarButton
          href="/analytics"
          icon={<BarChart3 size={15} strokeWidth={1.9} />}
        />

        <SidebarButton
          href="/settings"
          icon={<Settings size={15} strokeWidth={1.9} />}
        />
      </div>

      {/* BOTTOM CAPSULE */}
      <div className="mt-auto bg-white rounded-full px-2 py-2 flex flex-col items-center gap-2">
        <SidebarButton
          icon={
            <LogOut
              size={16}
              strokeWidth={1.9}
              className="scale-x-[-1]"
            />
          }
          // optional: take user to login on logout click - left blank intentionally
        />
      </div>

    </aside>
  );
}

function SidebarButton({
  icon,
  active = false,
  href,
}: {
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive =
    active || (href ? pathname === href || pathname?.startsWith(href + "/") : false);

  const handleClick = (e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    try {
      router.push(href);
    } catch {
      window.location.href = href;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      className={`
        flex items-center justify-center
        h-8 w-8 rounded-full
        transition-all duration-200
        ${
          isActive
            ? "bg-[#111827] text-white"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        }
      `}
    >
      {icon}
    </button>
  );
}