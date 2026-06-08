"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="h-20 bg-white border-b border-[#e5e5e5] px-6 sticky top-0 z-40">
      <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-8">

        {/* LOGO SECTION - Left */}
        <div className="justify-self-start flex items-center">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center bg-white border border-[#e5e5e5]">
              <Image
                src="/akousticarts.webp"
                alt="Akoustic Arts"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-sm font-semibold text-[#1a1a1a] tracking-tight hidden sm:inline">
              Akoustic Arts
            </span>
          </div>
        </div>

        {/* CENTER NAV - Horizontal menu */}
        <nav className="flex items-center gap-1">
          <NavItem href="/dashboard">Overview</NavItem>
          <NavItem href="/schedule">Schedule</NavItem>
          {(() => {
            const role = (user as { role?: string } | undefined)?.role || "";
            return (user && String(role).toUpperCase() === "SUPER_ADMIN") ? <NavItem href="/clients">Clients</NavItem> : null;
          })()}
          <NavItem href="/players">Players</NavItem>
          <NavItem href="/library/playlists">Playlists</NavItem>
          <NavItem href="/library/audio">Audios</NavItem>
          <NavItem href="/analytics">Analytics</NavItem>
          <NavItem href="/settings">Settings</NavItem>
        </nav>

        {/* RIGHT SIDE - Language + Profile */}
        <div className="flex items-center justify-end gap-4">
          
          {/* LANGUAGE SELECTOR */}
          <div className="flex items-center gap-1 rounded-lg bg-[#f9f9fa] p-1">
            <LanguageButton lang="🇬🇧" label="English" />
            <LanguageButton lang="🇫🇷" label="French" />
          </div>

          {/* PROFILE SECTION */}
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
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${
          isActive
            ? "bg-[#1a1a1a] text-white"
            : "text-[#666666] hover:text-[#1a1a1a] hover:bg-[#f9f9fa]"
        }
      `}
    >
      {children}
    </button>
  );
}

function LanguageButton({ lang, label }: { lang: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={`Switch to ${label}`}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[#666666] transition-all duration-200 hover:bg-white hover:text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#A473FF] focus:ring-offset-1"
      title={label}
    >
      <span role="img" aria-hidden className="text-base">
        {lang}
      </span>
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
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white hover:bg-[#f9f9fa] transition-all duration-200 cursor-pointer">
      {typeof avatar === "string" && (avatar.startsWith("http://") || avatar.startsWith("https://")) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <Image src={avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
      )}

      <div className="leading-tight hidden sm:block">
        <div className="text-xs font-semibold text-[#1a1a1a]">{name}</div>
        <div className="text-xs text-[#666666]">{email?.split("@")[0]}</div>
      </div>

      <ChevronDown size={16} strokeWidth={2} className="text-[#666666] ml-1" />
    </div>
  );
}
