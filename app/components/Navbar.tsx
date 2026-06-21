/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import SignOutModal from "./SignOutModal";

import type { UserProfileEventDetail } from "@/lib/user-profile-events";
import { cn } from "@/utils/cn";

const USER_STORAGE_KEY = "akou.user";

const shellTrackClass = "bg-zinc-100/80 dark:bg-[#09090C]/90";

const shellActiveClass =
  "bg-zinc-900 text-white shadow-sm shadow-zinc-900/15 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-none";

const shellInactiveClass =
  "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-[#18181B]/60";

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
      <header className="relative z-50 h-16 bg-white/85 px-4 backdrop-blur-md dark:bg-[#18181B]/95 lg:h-[76px] lg:px-5">
        <div className="grid h-full items-center justify-between lg:grid-cols-[300px_1fr_340px]">
          <div className="justify-self-start">
            <div className={cn("flex items-center gap-3 rounded-full px-3 py-2 lg:px-4", shellTrackClass)}>
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-[#09090C]">
                <Image
                  src="/akousticarts.webp"
                  alt="Akoustic Arts"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>

              <span className="hidden text-[15px] font-semibold tracking-tight text-zinc-900 lg:block dark:text-zinc-100">
                Akoustic Arts
              </span>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <nav className={cn("flex items-center rounded-full p-1", shellTrackClass)}>
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
     

            <div className={cn("hidden items-center gap-1.5 rounded-full px-2 py-1 lg:flex", shellTrackClass)}>
              <button
                type="button"
                aria-label="Switch to English"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 hover:bg-white/70 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30 dark:text-zinc-400 dark:hover:bg-[#18181B]/60 dark:hover:text-zinc-100"
              >
                <span role="img" aria-hidden className="text-sm">
                  🇬🇧
                </span>
              </button>

              <button
                type="button"
                aria-label="Switch to French"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 hover:bg-white/70 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30 dark:text-zinc-400 dark:hover:bg-[#18181B]/60 dark:hover:text-zinc-100"
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
                    className="fixed inset-0 z-[90]"
                    onClick={() => setIsProfileOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsProfileOpen(false)}
                    aria-hidden
                  />
                  <div className="fixed right-4 top-16 z-[100] mt-1 w-56 overflow-hidden rounded-xl bg-white shadow-lg shadow-black/[0.06] dark:bg-[#18181B] dark:shadow-black/20 lg:right-5 lg:top-[76px]">
                    <div className="bg-zinc-50/80 p-4 dark:bg-[#09090C]/50">
                      <p
                        className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        title={(user as { name?: string } | undefined)?.name}
                      >
                        {(user as { name?: string } | undefined)?.name ||
                          (user as { email?: string } | undefined)?.email ||
                          "User"}
                      </p>
                      <p
                        className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400"
                        title={(user as { email?: string } | undefined)?.email}
                      >
                        {(user as { email?: string } | undefined)?.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          router.push("/settings");
                          setIsProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50/90 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                      >
                        <Settings size={16} className="text-zinc-500 dark:text-zinc-400" />
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setShowLogoutDialog(true);
                          setIsProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50/90 dark:text-red-400 dark:hover:bg-red-950/30"
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
      className={cn(
        "group relative rounded-full px-5 py-2 text-[13px] font-medium tracking-tight transition-all duration-200",
        isActive ? shellActiveClass : shellInactiveClass
      )}
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
      title={`${name}${email ? ` · ${email}` : ""}`}
      className={cn(
        "flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-full px-2 py-1 transition-colors lg:gap-3 lg:px-3",
        shellTrackClass,
        "hover:bg-zinc-100 dark:hover:bg-[#09090C]/80"
      )}
    >
      {avatarUrl && !avatarError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          onError={() => setAvatarError(true)}
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold tracking-wide text-zinc-600 dark:bg-[#09090C] dark:text-zinc-200"
          aria-hidden
        >
          {initials || "U"}
        </div>
      )}

        <div className="hidden min-w-0 max-w-[11.5rem] shrink text-left leading-tight lg:block">
          <div className="truncate text-[13px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            {name}
          </div>
          <div className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">{email}</div>
        </div>

      <ChevronDown
        size={14}
        strokeWidth={1.9}
        className={`hidden shrink-0 lg:block text-zinc-500 dark:text-zinc-400 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}
