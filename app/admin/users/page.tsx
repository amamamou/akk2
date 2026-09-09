import { redirect } from "next/navigation";

export const metadata = { title: "Admin - Users" };

/** User provisioning is managed from the live Clients workspace for now. */
export default function AdminUsersPage() {
  redirect("/clients");
}
