"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { passwordSetupPathFromUrl } from "@/lib/auth-public-routes";

/**
 * Root must not server-redirect: Supabase often lands on Site URL `/` with
 * `#access_token=…` and a server redirect to /login strips the hash.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const dest = passwordSetupPathFromUrl(
      window.location.search,
      window.location.hash,
      window.location.pathname
    );
    if (dest) {
      window.location.replace(`${dest}${window.location.search}${window.location.hash}`);
      return;
    }
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-sm text-zinc-500 dark:bg-[#09090C]">
      Redirecting…
    </div>
  );
}
