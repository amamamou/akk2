"use client";

import { useState } from "react";
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
import { ConfirmDialog } from "./ConfirmDialog";
import { isSuperAdminRole } from "@/lib/rbac";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // RBAC: the /clients route is Super Admin only. Use the centralized type-safe helper
  // instead of a loose /admin/i regex (which would also match CLIENT_ADMIN, etc.).
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
      <aside className="fixed bottom-0 left-0 right-0 lg:static w-full h-20 lg:h-full lg:w-[76px] bg-white flex lg:flex-col items-center justify-between lg:justify-start lg:py-4 px-4 lg:px-0 border-t lg:border-t-0 border-zinc-200">
        {/* TOP CAPSULE - Hidden on mobile */}
        <div className="hidden lg:flex bg-[#F4F4F5] rounded-full px-2 py-2 flex-col items-center gap-2">
          <SidebarButton icon={<SunDim size={16} strokeWidth={1.9} />} />
          <SidebarButton icon={<MoonStar size={16} strokeWidth={1.9} />} />
        </div>

        {/* CENTER CAPSULE */}
        <div className="flex lg:flex-col lg:mt-6 bg-[#F4F4F5] rounded-full lg:px-2.5 lg:py-3 px-2 py-2 items-center gap-2">
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
            icon={<Speaker size={15} strokeWidth={1.9} />}
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

        {/* BOTTOM CAPSULE */}
        <div className="bg-[#F4F4F5] rounded-full px-2 py-2 flex lg:flex-col items-center gap-2 lg:mt-auto">
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

      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign out?"
        description="You'll be logged out of your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutDialog(false)}
        isDangerous={false}
      />
    </>
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
      className={`
        flex items-center justify-center
        h-8 w-8 rounded-full
        transition-all duration-200
        relative
        group
        ${
          isActive
            ? "bg-[#111827] text-white"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        }
      `}
    >
      {/* Subtle shine effect on active state */}
      {isActive && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-50" />
        </div>
      )}
      <span className="relative z-10">{icon}</span>
    </button>
  );
}
