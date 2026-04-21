import { create } from "zustand";
import { applyThemeToDocument, getStoredTheme, persistTheme } from "@/utils/theme";

export type AppTheme = "light" | "dark";

export interface AppState {
  theme: AppTheme;
  toggleTheme: () => void;
}

const initialTheme = getStoredTheme();
applyThemeToDocument(initialTheme);

export const useAppStore = create<AppState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "light" ? "dark" : "light";
      persistTheme(nextTheme);
      applyThemeToDocument(nextTheme);

      return {
        theme: nextTheme,
      };
    }),
}));
