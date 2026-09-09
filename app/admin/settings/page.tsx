import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Settings",
};

/** Legacy admin shell — settings live at /settings. */
export default function AdminSettingsPage() {
  redirect("/settings");
}
