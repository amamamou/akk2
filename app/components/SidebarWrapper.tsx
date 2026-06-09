"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"

export default function SidebarWrapper() {
  const pathname = usePathname()

  // Hide the sidebar on auth entry pages
  if (pathname === "/login" || pathname === "/create-account") return null

  return <Sidebar />
}
