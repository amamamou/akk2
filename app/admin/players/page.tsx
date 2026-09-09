import { redirect } from "next/navigation";

export const metadata = { title: "Admin - Players" };

/** Prefer the live Players workspace (tenant-scoped + Super Admin switcher). */
export default function AdminPlayersPage() {
  redirect("/players");
}
