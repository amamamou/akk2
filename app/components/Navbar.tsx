/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { ConfirmDialog } from "./ConfirmDialog";  

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <header className="h-16 lg:h-[76px] bg-white px-4 lg:px-5 border-b border-zinc-200">
        <div className="flex h-full items-center justify-between lg:grid lg:grid-cols-[300px_1fr_340px]">
          {/* LOGO CAPSULE */}
          <div className="justify-self-start">
            <div className="flex items-center gap-3 rounded-full bg-[#F4F4F5] px-3 lg:px-4 py-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0 bg-linear-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <Image
                  src="/akousticarts.webp"
                  alt="Akoustic Arts"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>

              <span className="hidden lg:block text-[15px] font-medium text-zinc-900">
                Akoustic Arts
              </span>
            </div>
          </div>

          {/* CENTER NAV CAPSULE - Hidden on mobile */}
          <div className="hidden lg:flex justify-center">
            <nav className="flex items-center rounded-full bg-[#F4F4F5] p-1">
              <NavItem href="/dashboard">Overview</NavItem>
              <NavItem href="/schedule">Schedule</NavItem>
              {(() => {
                const role = (user as { role?: string } | undefined)?.role || "";
                return user && String(role).toUpperCase() === "SUPER_ADMIN" ? (
                  <NavItem href="/clients">Clients</NavItem>
                ) : null;
              })()}
              <NavItem href="/players">Players</NavItem>
              <NavItem href="/library/playlists">Playlists</NavItem>
              <NavItem href="/library/audio">Audios</NavItem>
              <NavItem href="/analytics">Analytics</NavItem>
              <NavItem href="/settings">Settings</NavItem>
            </nav>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center justify-end gap-2 lg:gap-3">
            {/* LANGUAGE SELECTOR - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 rounded-full bg-[#F4F4F5] px-2 py-1">
              <button
                type="button"
                aria-label="Switch to English"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#A473FF]"
              >
                <span role="img" aria-hidden className="text-sm">
                  🇬🇧
                </span>
              </button>

              <button
                type="button"
                aria-label="Switch to French"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#A473FF]"
              >
                <span role="img" aria-hidden className="text-sm">
                  🇫🇷
                </span>
              </button>
            </div>

            {/* PROFILE CAPSULE */}
            <div className="relative">
              <UserProfile
                user={user}
                isOpen={isProfileOpen}
                onToggle={() => setIsProfileOpen(!isProfileOpen)}
              />

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden">
                    {/* Profile Info */}
                    <div className="p-4 border-b border-zinc-200 bg-zinc-50">
                      <p className="text-sm font-medium text-zinc-900">
                        {(user as { name?: string } | undefined)?.name ||
                          (user as { email?: string } | undefined)?.email ||
                          "User"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {(user as { email?: string } | undefined)?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          router.push("/settings");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <Settings size={16} className="text-zinc-500" />
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setShowLogoutDialog(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="scale-x-[-1]" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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

function NavItem({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive =
    href ? pathname === href || pathname?.startsWith(href + "/") : false;

  const onClick = (e: React.MouseEvent) => {
    if (!href) return;
    e.preventDefault();
    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`
        rounded-full
        px-5
        py-2
        text-[14px]
        font-medium
        transition-all duration-200
        relative
        group
        ${
          isActive
            ? "bg-[#111827] text-white"
            : "text-zinc-500 hover:text-zinc-900"
        }
      `}
    >
      {/* Subtle shine on active */}
      {isActive && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-50" />
        </div>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function UserProfile({
  user,
  isOpen,
  onToggle,
}: {
  user: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  type SimpleUser = { name?: string; email?: string; avatar?: string | null };
  const u = user as SimpleUser | undefined;
  const name = u?.name || u?.email || "User";
  const email = u?.email || "";
  const avatar = u?.avatar || "https://i.pravatar.cc/40";

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 lg:gap-3 rounded-full bg-[#F4F4F5] px-2 lg:px-3 py-1 hover:bg-zinc-100 transition-colors"
    >
      {typeof avatar === "string" &&
      (avatar.startsWith("http://") || avatar.startsWith("https://")) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <Image
          src={avatar}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
      )}

      <div className="hidden lg:block leading-tight text-left">
        <div className="text-[13px] font-medium text-zinc-900">{name}</div>
        <div className="text-[11px] text-zinc-400">{email}</div>
      </div>

      <ChevronDown
        size={14}
        strokeWidth={1.9}
        className={`hidden lg:block text-zinc-500 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
