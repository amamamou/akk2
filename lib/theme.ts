export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "akou.theme";
export const THEME_CHANGED_EVENT = "akou:theme-changed";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
}

export function resolveTheme(): ThemeMode {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function setTheme(theme: ThemeMode) {
  applyTheme(theme);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme } })
    );
  }
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = resolveTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
