"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import SidebarWrapper from "./SidebarWrapper";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/create-account";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="grid h-screen grid-rows-[72px_1fr] dark:bg-[#121214]">
      <Navbar />

  <div className="flex flex-1 overflow-hidden">
        <SidebarWrapper />

        <main className="flex-1 overflow-auto bg-white dark:bg-[#121214]">
          {children}
        </main>
      </div>
    </div>
  );
}
