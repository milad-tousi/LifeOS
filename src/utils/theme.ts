import type { AppTheme } from "@/state/app.store";

const THEME_STORAGE_KEY = "lifeos.theme";

export function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

export function persistTheme(theme: AppTheme): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}
