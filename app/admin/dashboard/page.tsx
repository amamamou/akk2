import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard",
};

/** Legacy mock admin shell — Super Admin workspace is /clients. */
export default function AdminDashboardPage() {
  redirect("/clients");
}
