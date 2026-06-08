"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  SunDim,
  MoonStar,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Speaker,
  ListMusic,
  Music,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const roleCandidate = (user as { role?: unknown } | undefined)?.role;
  const isAdmin = typeof roleCandidate === "string" && /admin/i.test(roleCandidate);
  
  return (
    <aside className="w-20 h-full bg-white border-r border-[#e5e5e5] flex flex-col items-center py-5 sticky left-0 top-0">

      {/* THEME TOGGLE */}
      <div className="flex flex-col items-center gap-1 mb-8">
        <SidebarButton
          icon={<SunDim size={18} strokeWidth={1.5} />}
          tooltip="Light"
        />
        <SidebarButton
          icon={<MoonStar size={18} strokeWidth={1.5} />}
          tooltip="Dark"
        />
      </div>

      {/* MAIN NAVIGATION */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <SidebarButton
          href="/dashboard"
          icon={<LayoutDashboard size={18} strokeWidth={1.5} />}
          tooltip="Dashboard"
        />

        <SidebarButton
          href="/schedule"
          icon={<CalendarDays size={18} strokeWidth={1.5} />}
          tooltip="Schedule"
        />

        {isAdmin && (
          <SidebarButton
            href="/clients"
            icon={<Users size={18} strokeWidth={1.5} />}
            tooltip="Clients"
          />
        )}

        <SidebarButton
          href="/players"
          icon={<Speaker size={18} strokeWidth={1.5} />}
          tooltip="Players"
        />

        <SidebarButton
          href="/library/playlists"
          icon={<ListMusic size={18} strokeWidth={1.5} />}
          tooltip="Playlists"
        />

        <SidebarButton
          href="/library/audio"
          icon={<Music size={18} strokeWidth={1.5} />}
          tooltip="Audios"
        />

        <SidebarButton
          href="/analytics"
          icon={<BarChart3 size={18} strokeWidth={1.5} />}
          tooltip="Analytics"
        />

        <SidebarButton
          href="/settings"
          icon={<Settings size={18} strokeWidth={1.5} />}
          tooltip="Settings"
        />
      </div>

      {/* LOGOUT */}
      <div className="mt-auto">
        <SidebarButton
          icon={
            <LogOut
              size={18}
              strokeWidth={1.5}
              className="scale-x-[-1]"
            />
          }
          tooltip="Sign out"
          onClick={() => {
            const ok = confirm("Sign out?");
            if (!ok) return;
            try {
              logout();
            } catch {
              try {
                const keys = [
                  'akou_access_token','akou_tenant_id','akou_tenant_slug','akou_user','akou_user_email',
                  'fastapi_token','fastapi_tenant_id','fastapi_tenant_slug','fastapi_user','fastapi_user_email'
                ];
                keys.forEach((k) => localStorage.removeItem(k));
              } catch {
                // noop
              }
              try {
                router.push('/login');
              } catch {
                window.location.href = '/login';
              }
            }
          }}
        />
      </div>

    </aside>
  );
}

function SidebarButton({
  icon,
  active = false,
  href,
  onClick,
  tooltip,
}: {
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: (e?: React.MouseEvent) => void;
  tooltip?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive =
    active || (href ? pathname === href || pathname?.startsWith(href + "/") : false);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      try {
        onClick(e);
      } catch {
        // ignore
      }
      return;
    }

    if (!href) return;
    e.preventDefault();
    try {
      router.push(href);
    } catch {
      window.location.href = href;
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        className={`
          flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200
          ${
            isActive
              ? "bg-[#A473FF] text-white shadow-md"
              : "text-[#666666] hover:bg-[#f9f9fa] hover:text-[#1a1a1a]"
          }
        `}
      >
        {icon}
      </button>
      {tooltip && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}
