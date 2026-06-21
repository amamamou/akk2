"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  dashboardBrandGradient,
  dashboardCardClass,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import AuthBrandPanel from "./components/AuthBrandPanel";
import AuthField from "./components/AuthField";

type AuthView = "login" | "register" | "forgot";

const VIEW_COPY: Record<
  AuthView,
  { eyebrow: string; title: string; subtitle: string; cta: string; loading: string }
> = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to your workspace",
    subtitle: "Enter your credentials to access clients, playlists, and live players.",
    cta: "Sign in",
    loading: "Signing in…",
  },
  register: {
    eyebrow: "Get started",
    title: "Create your account",
    subtitle: "Set up access to the Akoustic Arts workspace platform.",
    cta: "Create account",
    loading: "Creating account…",
  },
  forgot: {
    eyebrow: "Account recovery",
    title: "Reset your password",
    subtitle: "We'll send a secure link to your email if an account exists.",
    cta: "Send reset link",
    loading: "Sending…",
  },
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  const copy = VIEW_COPY[currentView];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (error) clearError();
  };

  const switchView = (view: AuthView) => {
    setCurrentView(view);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentView === "login") {
      try {
        await login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });
      } catch (err) {
        console.error("Login error:", err);
      }
    } else if (currentView === "register") {
      alert("Registration via frontend coming soon. Please contact support.");
    } else {
      alert("Password reset coming soon. Please contact support.");
    }
  };

  const passwordToggle = (visible: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans">
      <AuthBrandPanel />

      {/* Form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        {/* Mobile brand strip */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-zinc-200/80">
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
            <p className="text-sm font-semibold text-zinc-900">Akoustic Arts</p>
            <p className={cn(dashboardSectionLabel, "text-zinc-400")}>Workspace platform</p>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div
            className={cn(
              dashboardCardClass,
              "overflow-hidden border-zinc-200/70 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-9"
            )}
          >
            {(currentView === "register" || currentView === "forgot") && (
              <button
                type="button"
                onClick={() => switchView("login")}
                className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-[#8B5CF6]"
              >
                <ArrowLeft size={14} strokeWidth={2} />
                Back to sign in
              </button>
            )}

            <div className="mb-8 space-y-2">
              <p className={cn(dashboardSectionLabel, "text-zinc-400")}>{copy.eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{copy.title}</h1>
              <p className="text-sm leading-relaxed text-zinc-500">{copy.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {currentView === "register" && (
                <AuthField
                  id="name"
                  label="Full name"
                  placeholder="Jane Cooper"
                  value={formData.name}
                  onChange={handleInputChange}
                  icon={User}
                  autoComplete="name"
                />
              )}

              <AuthField
                id="email"
                label="Email address"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleInputChange}
                icon={Mail}
                autoComplete="email"
              />

              {currentView !== "forgot" && (
                <AuthField
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  icon={Lock}
                  autoComplete={currentView === "login" ? "current-password" : "new-password"}
                  trailing={passwordToggle(showPassword, () => setShowPassword(!showPassword))}
                />
              )}

              {currentView === "register" && (
                <AuthField
                  id="confirmPassword"
                  label="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  icon={Lock}
                  autoComplete="new-password"
                  trailing={passwordToggle(showConfirmPassword, () =>
                    setShowConfirmPassword(!showConfirmPassword)
                  )}
                />
              )}

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              ) : null}

              {currentView === "login" && (
                <div className="flex items-center justify-between gap-4 pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 rounded border-zinc-300 text-[#A473FF] focus:ring-[#A473FF]/30"
                    />
                    <span className="text-sm text-zinc-500">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    className="text-sm font-medium text-[#8B5CF6] transition-colors hover:text-[#A473FF]"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-medium text-white transition-all",
                  "hover:opacity-95 active:scale-[0.99]",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
                style={{ background: dashboardBrandGradient }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" strokeWidth={2} />
                    {copy.loading}
                  </>
                ) : (
                  <>
                    {copy.cta}
                    <ArrowRight
                      size={16}
                      strokeWidth={2}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            {currentView === "login" && (
              <p className="mt-8 text-center text-sm text-zinc-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("register")}
                  className="font-medium text-[#8B5CF6] transition-colors hover:text-[#A473FF]"
                >
                  Request access
                </button>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-400">
            Protected workspace · Enterprise SSO coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
