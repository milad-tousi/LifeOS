import { create } from "zustand";

export type AppTheme = "light" | "dark";

export interface AppState {
  theme: AppTheme;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
}));
