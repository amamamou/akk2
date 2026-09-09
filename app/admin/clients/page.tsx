import { redirect } from "next/navigation";

export const metadata = { title: "Admin - Clients" };

/** Legacy /admin/clients → live Super Admin Clients page. */
export default function AdminClientsPage() {
  redirect("/clients");
}
