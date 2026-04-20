/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Speaker,
  ListMusic,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "../../utils/cn";

const USER_STORAGE_KEY = "akou.user";

type StoredUserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
};

const navigationGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Schedule", href: "/schedule", icon: CalendarDays },
      { name: "Players", href: "/players", icon: Speaker },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        name: "Library",
        href: "/library/playlists",
        icon: ListMusic,
        submenu: [
          { name: "Playlists", href: "/library/playlists" },
          { name: "All Audio", href: "/library/audio" },
        ],
      },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { name: string; href: string }[];
}
// Small color tokens kept local here for readability; consider moving into tailwind.config.cjs
const COLORS = {
  hoverBg: "#F5F5F5",
  activeBg: "#E7E7E7",
  pressedBg: "#F3F4F6",
};

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [libraryExpanded, setLibraryExpanded] = useState<boolean>(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [userName, setUserName] = useState<string>("Your profile");
  const [userRole, setUserRole] = useState<string>("Update in Settings");
  const [userInitials, setUserInitials] = useState<string>("U");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Hydrate sidebar preferences from localStorage on the client only.
  const applyUserProfile = useCallback((profile: StoredUserProfile) => {
    const first = profile.firstName?.trim() ?? "";
    const last = profile.lastName?.trim() ?? "";
    const role = profile.role?.trim() ?? "";
    const avatar =
      profile.avatar && typeof profile.avatar === "string"
        ? profile.avatar
        : null;

    const fullName = first || last
      ? [first, last].filter(Boolean).join(" ")
      : "Your profile";

    const initialsRaw = `${first.charAt(0)}${last.charAt(0)}`.trim();
    const initials = initialsRaw || "U";

    setUserName(fullName);
    setUserRole(role || "Update in Settings");
    setUserInitials(initials.toUpperCase());
    setUserAvatar(avatar);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedCollapsed = window.localStorage.getItem("akou.sidebar.collapsed");
      if (savedCollapsed === "true") {
        setCollapsed(true);
      }

      const savedTheme = window.localStorage.getItem("akou.theme");
      if (savedTheme === "dark") {
        setTheme("dark");
      }

      const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser) as StoredUserProfile;
          if (parsed && typeof parsed === "object") {
            applyUserProfile(parsed);
          }
        } catch {
          // ignore malformed user data
        }
      }
    } catch {
      // noop – fall back to defaults
    }
  }, [applyUserProfile]);

  // Apply theme at the document level
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setCollapsed((s) => {
      const next = !s;
      try {
        localStorage.setItem("akou.sidebar.collapsed", String(next));
      } catch {
        // noop
      }
      return next;
    });
  }, []);

  // (Language and theme UI controls removed) - theme state remains for document-level class

  // React to profile changes coming from the Settings page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUserUpdated = (event: Event) => {
      try {
        const custom = event as CustomEvent<StoredUserProfile>;
        if (custom.detail) {
          applyUserProfile(custom.detail);
          return;
        }
      } catch {
        // fall through to storage reload
      }

      try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as StoredUserProfile;
        if (parsed && typeof parsed === "object") {
          applyUserProfile(parsed);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("akou:user-updated", handleUserUpdated as EventListener);
    return () => {
      window.removeEventListener("akou:user-updated", handleUserUpdated as EventListener);
    };
  }, [applyUserProfile]);

  // Render navigation groups with section labels and optional submenu
  const renderNavigation = () => {
    return (
      <nav
        className={cn(
          "flex flex-1 flex-col",
          collapsed ? "space-y-4 py-1" : "space-y-6 py-2"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {navigationGroups.map((group) => (
          <div key={group.label} className="flex flex-col space-y-2">
            {!collapsed && (
              <div className={cn("px-3", collapsed ? "py-1" : "py-2")}>
                <p className="text-xs text-gray-400 font-medium px-3">
                  {group.label}
                </p>
              </div>
            )}

            <div className="flex flex-col space-y-1">
              {group.items.map((item) => {
                // Determine active state. A parent with submenu should be active
                // when any of its submenu items are active (e.g. /library/audio).
                let isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                if (item.submenu && item.submenu.length > 0) {
                  const subActive = item.submenu.some(
                    (s) => pathname === s.href || pathname.startsWith(s.href + "/")
                  );
                  if (subActive) isActive = true;
                }

                const Icon = item.icon;
                const isLibrary = item.name === "Library";
                // Auto-expand the library submenu when the current path is inside it
                const showSubmenu = isLibrary && (libraryExpanded || isActive) && !collapsed;

                return (
                  <div key={item.name}>
                    <NavLink
                      item={item}
                      isActive={isActive}
                      collapsed={collapsed}
                      Icon={Icon}
                      hasSubmenu={!!item.submenu}
                      isExpanded={libraryExpanded}
                      onToggleSubmenu={() => setLibraryExpanded(!libraryExpanded)}
                    />

                    {showSubmenu && item.submenu && (
                      <div
                        className={cn(
                          "flex flex-col space-y-1 mt-1 border-l border-gray-100",
                          collapsed ? "ml-3 pl-2" : "ml-4 pl-3"
                        )}
                      >
                        {item.submenu.map((subitem) => {
                          const isSubActive = pathname === subitem.href;
                          return (
                            <Link
                              key={subitem.name}
                              href={subitem.href}
                              className={cn(
                                "block text-sm px-3 rounded-2xl transition-all duration-200 w-full text-left",
                                collapsed ? "py-2" : "py-2.5",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400",
                                isSubActive
                                  ? `text-gray-900 bg-[${COLORS.pressedBg}] font-medium`
                                  : "text-gray-600 hover:text-gray-700 hover:bg-[#F5F5F5]"
                              )}
                            >
                              {subitem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  };

  // Render bottom section - controls
  const renderBottomSection = () => {
    if (!collapsed) {
      return (
        <div className="flex flex-col gap-4">
          {/* User Profile Section */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 hover:bg-gray-100 transition-colors cursor-default">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0 overflow-hidden">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userName}
                      width={32}
                      height={32}
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userRole}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const ok = confirm("Sign out?");
                  if (ok) {
                    try {
                      localStorage.removeItem("akou.session");
                      localStorage.removeItem("akou.sidebar.collapsed");
                    } catch {
                      // noop
                    }
                    router.push("/");
                  }
                }}
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-md",
                  "text-gray-500 hover:text-gray-700 hover:bg-white",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                )}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // Collapsed state - only show avatar to keep UI compact and avoid accidental sign-outs
      return (
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden"
            aria-hidden="true"
            title={userName}
          >
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 bg-white",
        collapsed ? "w-20" : "w-64",
        "transition-all duration-300 ease-in-out",
        "overflow-visible z-50 relative"
      )}
      aria-label="Sidebar"
    >
      {/* Header with Logo and Toggle */}
  <div className="flex h-12 shrink-0 items-center justify-between px-2  border-gray-200">
    <div
      className={cn(
        "flex items-center gap-2 font-semibold text-gray-900 flex-1",
        collapsed ? "justify-center" : ""
      )}
    >
          {collapsed ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-md flex-shrink-0">
              <Image
                src="/akousticarts.webp"
                alt="Akoustic Arts"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <>
              <div className="relative h-5 w-5 overflow-hidden rounded-sm flex-shrink-0">
                <Image
                  src="/akousticarts.webp"
                  alt="Akoustic Arts"
                  fill
                  sizes="24px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-semibold tracking-tight truncate">
                Akoustic Arts
              </span>
            </>
          )}
        </div>

        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          aria-expanded={!collapsed}
          onClick={toggle}
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-md",
            "text-gray-500 hover:text-gray-700 hover:bg-[#F5F5F5]",
            "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400",
            collapsed ? "ml-0" : "-mr-1"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 px-2">
        {renderNavigation()}
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 px-3 py-3">{renderBottomSection()}</div>
    </aside>
  );
}

// NavLink Component
function NavLink({
  item,
  isActive,
  collapsed,
  Icon,
  hasSubmenu,
  isExpanded,
  onToggleSubmenu,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  isExpanded?: boolean;
  onToggleSubmenu?: () => void;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasSubmenu && !collapsed) {
      e.preventDefault();
      onToggleSubmenu?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (hasSubmenu && !collapsed && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onToggleSubmenu?.();
    }
  };

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      title={collapsed ? item.name : undefined}
      onKeyDown={handleKeyDown}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-2xl",
        "transition-all duration-200",
        isActive
          ? `bg-[${COLORS.pressedBg}] text-gray-900`
          : "text-gray-500 hover:bg-[#F5F5F5] hover:text-gray-700",
        collapsed ? "justify-center" : "",
        hasSubmenu && !collapsed ? "cursor-pointer" : "",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
          isActive ? `bg-[${COLORS.pressedBg}]` : "bg-gray-100 group-hover:bg-[#F5F5F5]"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-700"
          )}
          aria-hidden="true"
        />
      </div>
      {!collapsed && (
        <div className="flex items-center justify-between flex-1">
          <span className="truncate font-medium">
            {item.name}
          </span>
          {hasSubmenu && (
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "h-4 w-4 ml-2 flex-shrink-0 transition-transform",
                isExpanded ? "rotate-90" : ""
              )}
            />
          )}
        </div>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <span
          className={cn(
            "pointer-events-none absolute left-20 top-1/2 -translate-y-1/2",
            "whitespace-nowrap rounded-md bg-gray-700 text-white text-xs px-2 py-1.5",
            "font-medium opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200 z-50",
            "transform group-hover:translate-x-1"
          )}
          role="tooltip"
          aria-hidden="true"
        >
          {item.name}
        </span>
      )}
    </Link>
  );
}
