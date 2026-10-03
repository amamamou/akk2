"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import {
  dashboardBrandGradient,
  dashboardCardClass,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import AuthBrandPanel from "@/app/login/components/AuthBrandPanel";
import AuthField from "@/app/login/components/AuthField";

type SetupToken = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: string | null;
};

function readSetupToken(): SetupToken {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const type = (hash.get("type") || query.get("type") || "").toLowerCase() || null;
  return {
    accessToken: hash.get("access_token") || query.get("access_token"),
    refreshToken: hash.get("refresh_token") || query.get("refresh_token"),
    tokenHash: hash.get("token_hash") || query.get("token_hash"),
    type,
  };
}

function resolveApiError(err: unknown, fallback: string) {
  const ax = err as {
    response?: { data?: { detail?: { error?: string } | string; error?: string } };
  };
  const data = ax.response?.data;
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object" && detail.error) return detail.error;
  if (data?.error) return data.error;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function PasswordSetupClient() {
  const pathname = usePathname();
  const isInvite = pathname === "/set-password";
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<SetupToken | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const parsed = readSetupToken();
    setToken(parsed);
    if (parsed.accessToken || parsed.tokenHash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, []);

  const hasToken = Boolean(token?.accessToken || token?.tokenHash);
  const title = isInvite ? "Create your password" : "Choose a new password";
  const subtitle = isInvite
    ? "Your invitation is ready. Set a password, then sign in to the workspace."
    : "Use the link from your email to set a new password, then sign in.";

  const passwordToggle = (visible: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
    </button>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!token || !hasToken) {
      setFormError("This link is missing a password token. Open the link from the email again.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await getApiClient().completePasswordSetup({
        password,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        tokenHash: token.tokenHash,
        type: token.type || (isInvite ? "invite" : "recovery"),
      });
      window.location.replace("/login?password=updated");
    } catch (err) {
      setFormError(resolveApiError(err, "Could not save the password. Request a new link and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans dark:bg-[#09090C]">
      <AuthBrandPanel />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-700">
            <Image
              src="/akousticarts.webp"
              alt="Akoustic Arts"
              width={32}
              height={32}
              className="rounded-md object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Akoustic Arts</p>
            <p className={cn(dashboardSectionLabel, "text-zinc-400")}>Workspace platform</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div
            className={cn(
              dashboardCardClass,
              "overflow-hidden border-zinc-200/70 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950 sm:p-9"
            )}
          >
            <div className="mb-8 space-y-2">
              <p className={cn(dashboardSectionLabel, "text-zinc-400")}>
                {isInvite ? "Invitation" : "Account recovery"}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-zinc-500">{subtitle}</p>
            </div>

            {!ready ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 size={16} className="animate-spin" />
                Opening your link…
              </div>
            ) : !hasToken ? (
              <div className="space-y-4">
                <div
                  role="alert"
                  className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  This link is missing or has already been used. Request a new password email, then
                  open the newest message.
                </div>
                <Link
                  href="/login?view=forgot"
                  className="inline-flex text-sm font-medium text-[#8B5CF6] hover:text-[#A473FF]"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <AuthField
                  id="password"
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  autoComplete="new-password"
                  trailing={passwordToggle(showPassword, () => setShowPassword((v) => !v))}
                />
                <AuthField
                  id="confirmPassword"
                  label="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={Lock}
                  autoComplete="new-password"
                  trailing={passwordToggle(showConfirmPassword, () =>
                    setShowConfirmPassword((v) => !v)
                  )}
                />

                {formError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                  >
                    {formError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-medium text-white transition-all",
                    "hover:opacity-95 active:scale-[0.99]",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                  style={{ background: dashboardBrandGradient }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" strokeWidth={2} />
                      Saving…
                    </>
                  ) : (
                    <>
                      Save password and sign in
                      <ArrowRight
                        size={16}
                        strokeWidth={2}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
