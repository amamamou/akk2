"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "md";
}

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-black text-white hover:bg-gray-900",
  outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  ghost: "bg-transparent text-gray-900 hover:bg-gray-50",
  link: "bg-transparent underline-offset-2 hover:underline text-gray-900",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export default Button;
