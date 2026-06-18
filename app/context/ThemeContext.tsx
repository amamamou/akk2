"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTheme,
  resolveTheme,
  setTheme as persistTheme,
  THEME_CHANGED_EVENT,
  toggleTheme as flipTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => ThemeMode;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    typeof window !== "undefined" ? resolveTheme() : "light"
  );

  useEffect(() => {
    applyTheme(resolveTheme());

    const onThemeChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: ThemeMode }>).detail;
      const next = detail?.theme ?? resolveTheme();
      setThemeState(next);
      applyTheme(next);
    };

    window.addEventListener(THEME_CHANGED_EVENT, onThemeChanged);
    return () => window.removeEventListener(THEME_CHANGED_EVENT, onThemeChanged);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    persistTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = flipTheme();
    setThemeState(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
