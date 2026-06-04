"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Info,
  ChevronDown,
} from "lucide-react";
// removed unused BarChart3 import
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="h-[76px] bg-[#F4F4F5] px-5">
      <div className="grid h-full grid-cols-[300px_1fr_340px] items-center">

        {/* LOGO CAPSULE */}
        <div className="justify-self-start">
          <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2">

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

            <span className="text-[15px] font-medium text-zinc-900">
              Akoustic Arts
            </span>

          </div>
        </div>

        {/* CENTER NAV CAPSULE */}
        <div className="flex justify-center">
          <nav className="flex items-center rounded-full bg-white p-1">

            <NavItem href="/dashboard">Overview</NavItem>
            <NavItem href="/schedule">Schedule</NavItem>
            <NavItem href="/players">Players</NavItem>
            <NavItem href="/library/playlists">Playlists</NavItem>
            <NavItem href="/library/audio">Audios</NavItem>
            <NavItem href="/analytics">Analytics</NavItem>
            <NavItem href="/settings">Settings</NavItem>

            {/* Admin-only: Clients (show for super admins) */}
            {(() => {
              const role = (user as { role?: string } | undefined)?.role || "";
              return (user && String(role).toUpperCase() === "SUPER_ADMIN") ? <NavItem href="/clients">Clients</NavItem> : null;
            })()}

          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-end gap-3">

          {/* ACTIONS CAPSULE */}
          <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1">

            <IconButton>
              <Search size={15} strokeWidth={1.9} />
            </IconButton>

            <IconButton>
              <Bell size={15} strokeWidth={1.9} />
            </IconButton>

            <IconButton>
              <Info size={15} strokeWidth={1.9} />
            </IconButton>

          </div>

            {/* PROFILE CAPSULE */}
            <UserProfile />

        </div>
      </div>
    </header>
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
  const isActive = href ? pathname === href || pathname?.startsWith(href + "/") : false;

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
        ${
          isActive
            ? "bg-[#111827] text-white"
            : "text-zinc-500 hover:text-zinc-900"
        }
      `}
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <button
      className="
        flex h-8 w-8 items-center justify-center
        rounded-full
        text-zinc-500
        transition-all duration-200
        hover:bg-zinc-50
        hover:text-zinc-800
      "
    >
      {children}
    </button>
  );
}

function UserProfile() {
  const { user } = useAuth();

  type SimpleUser = { name?: string; email?: string; avatar?: string | null };
  const u = user as SimpleUser | undefined;
  const name = u?.name || u?.email || "User";
  const email = u?.email || "";
  const avatar = u?.avatar || "https://i.pravatar.cc/40";

  return (
    <div className="flex items-center gap-3 rounded-full bg-white px-3 py-1">
    {typeof avatar === "string" && (avatar.startsWith("http://") || avatar.startsWith("https://")) ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <Image src={avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      )}

      <div className="leading-tight">
        <div className="text-[13px] font-medium text-zinc-900">{name}</div>
        <div className="text-[11px] text-zinc-400">{email}</div>
      </div>

      <ChevronDown size={14} strokeWidth={1.9} className="text-zinc-500" />
    </div>
  );
}