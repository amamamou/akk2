"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import {
  SunDim,
  MoonStar,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Radio,
  ListMusic,
  Music,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import SignOutModal from "./SignOutModal";
import { isSuperAdminRole } from "@/lib/rbac";
import { cn } from "@/utils/cn";

const shellTrackClass = "bg-zinc-100/80 dark:bg-[#09090C]/90";

const shellActiveClass =
  "bg-zinc-900 text-white shadow-sm shadow-zinc-900/15 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-none";

const shellInactiveClass =
  "text-zinc-500 hover:bg-white/70 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-[#18181B]/60 dark:hover:text-zinc-100";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isAdmin = isSuperAdminRole(user?.role);

  const handleLogoutConfirm = () => {
    try {
      logout();
    } catch {
      try {
        const keys = [
          "akou_access_token",
          "akou_tenant_id",
          "akou_tenant_slug",
          "akou_user",
          "akou_user_email",
          "fastapi_token",
          "fastapi_tenant_id",
          "fastapi_tenant_slug",
          "fastapi_user",
          "fastapi_user_email",
        ];
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        // noop
      }
      try {
        router.push("/login");
      } catch {
        window.location.href = "/login";
      }
    }
  };

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 z-40 flex h-20 w-full items-center justify-between bg-white/95 px-4 backdrop-blur-md dark:bg-[#18181B]/95 lg:static lg:h-full lg:w-[76px] lg:flex-col lg:justify-start lg:px-0 lg:py-4">
        <div className={cn("hidden flex-col items-center gap-2 rounded-full px-2 py-2 lg:flex", shellTrackClass)}>
          <ThemeSidebarButton
            icon={<SunDim size={16} strokeWidth={1.9} />}
            active={theme === "light"}
            label="Light mode"
            onClick={() => setTheme("light")}
          />
          <ThemeSidebarButton
            icon={<MoonStar size={16} strokeWidth={1.9} />}
            active={theme === "dark"}
            label="Dark mode"
            onClick={() => setTheme("dark")}
          />
        </div>

        <div className={cn("flex items-center gap-2 rounded-full px-2 py-2 lg:mt-6 lg:flex-col lg:px-2.5 lg:py-3", shellTrackClass)}>
          <SidebarButton
            href="/dashboard"
            icon={<LayoutDashboard size={15} strokeWidth={1.9} />}
          />

          <SidebarButton
            href="/schedule"
            icon={<CalendarDays size={15} strokeWidth={1.9} />}
          />

          {isAdmin && (
            <SidebarButton
              href="/clients"
              icon={<Users size={15} strokeWidth={1.9} />}
            />
          )}

          <SidebarButton
            href="/players"
            icon={<Radio size={15} strokeWidth={1.9} />}
          />

          <SidebarButton
            href="/library/playlists"
            icon={<ListMusic size={15} strokeWidth={1.9} />}
          />

          <SidebarButton
            href="/library/audio"
            icon={<Music size={15} strokeWidth={1.9} />}
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

        <div className={cn("flex items-center gap-2 rounded-full px-2 py-2 lg:mt-auto lg:flex-col", shellTrackClass)}>
          <SidebarButton
            icon={
              <LogOut
                size={16}
                strokeWidth={1.9}
                className="scale-x-[-1]"
              />
            }
            onClick={() => setShowLogoutDialog(true)}
          />
        </div>
      </aside>

      <SignOutModal
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
        userName={user?.name}
        userEmail={user?.email}
      />
    </>
  );
}

function ThemeSidebarButton({
  icon,
  active,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        active ? shellActiveClass : shellInactiveClass
      )}
    >
      {active && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-50" />
        </div>
      )}
      <span className="relative z-10">{icon}</span>
    </button>
  );
}

function SidebarButton({
  icon,
  active = false,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: (e?: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive =
    active ||
    (href ? pathname === href || pathname?.startsWith(href + "/") : false);

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
    <button
      type="button"
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        isActive ? shellActiveClass : shellInactiveClass
      )}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-50" />
        </div>
      )}
      <span className="relative z-10">{icon}</span>
    </button>
  );
}
