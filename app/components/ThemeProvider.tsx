"use client";

import { useEffect } from "react";
import { applyTheme, resolveTheme } from "@/lib/theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(resolveTheme());

    const onThemeChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: "light" | "dark" }>).detail;
      if (detail?.theme) {
        applyTheme(detail.theme);
      } else {
        applyTheme(resolveTheme());
      }
    };

    window.addEventListener("akou:theme-changed", onThemeChanged);
    return () => window.removeEventListener("akou:theme-changed", onThemeChanged);
  }, []);

  return <>{children}</>;
}
