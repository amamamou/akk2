"use client"

import { usePathname } from "next/navigation"
import Sidebar from "../components/Sidebar"

export default function SidebarWrapper() {
  const pathname = usePathname()

  // Hide the sidebar on auth entry pages
  if (pathname === "/login" || pathname === "/create-account") return null

  const forceAdmin = pathname?.startsWith("/admin");

  return <Sidebar forceAdmin={Boolean(forceAdmin)} />
}
