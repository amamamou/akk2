"use client";

import { cn } from "@/utils/cn";
import {
  statusNeutralDot,
  statusOkDot,
  statusOkPing,
  statusPulseSoft,
  statusWarnDot,
} from "../dashboard-styles";

export type StatusDotVariant = "online" | "playing" | "warning" | "offline";

const variantDot: Record<StatusDotVariant, string> = {
  online: statusOkDot,
  playing: statusOkDot,
  warning: statusWarnDot,
  offline: statusNeutralDot,
};

const variantPing: Record<StatusDotVariant, string | null> = {
  online: statusOkPing,
  playing: statusOkPing,
  warning: null,
  offline: null,
};

export default function DashboardStatusDot({
  variant,
  size = "sm",
  pulse = true,
  className,
}: {
  variant: StatusDotVariant;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}) {
  const dim = size === "md" ? "h-2 w-2" : "h-1.5 w-1.5";
  const dot = variantDot[variant];
  const ping = variantPing[variant];
  const shouldPulse = pulse && ping && variant !== "offline";

  if (!shouldPulse) {
    return (
      <span
        className={cn("inline-flex shrink-0 rounded-full", dim, dot, className)}
        aria-hidden
      />
    );
  }

  return (
    <span className={cn("relative inline-flex shrink-0", dim, className)} aria-hidden>
      <span className={cn(statusPulseSoft, ping, variant === "playing" && "opacity-30")} />
      <span className={cn("relative inline-flex rounded-full", dim, dot)} />
    </span>
  );
}
