/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { ConfirmDialog } from "./ConfirmDialog";

import type { UserProfileEventDetail } from "@/lib/user-profile-events";

const USER_STORAGE_KEY = "akou.user";

function readStoredAvatar(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { avatar?: string | null };
    const avatar = parsed?.avatar;
    if (
      typeof avatar === "string" &&
      (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/"))
    ) {
      return avatar;
    }
  } catch {
    // ignore
  }
  return null;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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

  const toggleDarkMode = () => {
    toggleTheme();
  };

  return (
    <>
      <header className="h-16 lg:h-[76px] bg-white dark:bg-[#121214] px-4 lg:px-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex h-full items-center justify-between lg:grid lg:grid-cols-[300px_1fr_340px]">
          <div className="justify-self-start">
            <div className="flex items-center gap-3 rounded-full bg-[#F4F4F5] dark:bg-zinc-900 px-3 lg:px-4 py-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0 bg-linear-to-br from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                <Image
                  src="/akousticarts.webp"
                  alt="Akoustic Arts"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>

              <span className="hidden lg:block text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                Akoustic Arts
              </span>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <nav className="flex items-center rounded-full bg-[#F4F4F5] dark:bg-zinc-900 p-1">
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

          <div className="flex items-center justify-end gap-2 lg:gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F4F5] dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="hidden lg:flex items-center gap-2 rounded-full bg-[#F4F4F5] dark:bg-zinc-900 px-2 py-1">
              <button
                type="button"
                aria-label="Switch to English"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#A473FF]"
              >
                <span role="img" aria-hidden className="text-sm">
                  🇬🇧
                </span>
              </button>

              <button
                type="button"
                aria-label="Switch to French"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#A473FF]"
              >
                <span role="img" aria-hidden className="text-sm">
                  🇫🇷
                </span>
              </button>
            </div>

            <div className="relative">
              <UserProfile
                user={user}
                isOpen={isProfileOpen}
                onToggle={() => setIsProfileOpen(!isProfileOpen)}
              />

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {(user as { name?: string } | undefined)?.name ||
                          (user as { email?: string } | undefined)?.email ||
                          "User"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {(user as { email?: string } | undefined)?.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          router.push("/settings");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Settings size={16} className="text-zinc-500 dark:text-zinc-400" />
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setShowLogoutDialog(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
            ? "bg-[#111827] text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
        }
      `}
    >
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
  type SimpleUser = { name?: string; email?: string };
  const u = user as SimpleUser | undefined;
  const name = u?.name || u?.email || "User";
  const email = u?.email || "";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    typeof window !== "undefined" ? readStoredAvatar() : null
  );
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<UserProfileEventDetail>).detail;
      const nextAvatar = detail?.avatar ?? readStoredAvatar();
      setAvatarUrl(
        typeof nextAvatar === "string" &&
          (nextAvatar.startsWith("http://") ||
            nextAvatar.startsWith("https://") ||
            nextAvatar.startsWith("/"))
          ? nextAvatar
          : null
      );
      setAvatarError(false);
    };

    window.addEventListener("akou:user-updated", onProfileUpdated);
    return () => window.removeEventListener("akou:user-updated", onProfileUpdated);
  }, []);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 lg:gap-3 rounded-full bg-[#F4F4F5] dark:bg-zinc-900 px-2 lg:px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      {avatarUrl && !avatarError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          onError={() => setAvatarError(true)}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div
          className="h-8 w-8 rounded-full bg-gradient-to-br from-[#A473FF] to-[#7A42FF] flex items-center justify-center text-xs font-semibold text-white"
          aria-hidden
        >
          {initials || "U"}
        </div>
      )}

      <div className="hidden lg:block leading-tight text-left">
        <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{name}</div>
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{email}</div>
      </div>

      <ChevronDown
        size={14}
        strokeWidth={1.9}
        className={`hidden lg:block text-zinc-500 dark:text-zinc-400 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
