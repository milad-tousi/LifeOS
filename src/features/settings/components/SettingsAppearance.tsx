import { ChevronRight, Moon, Sun } from "lucide-react";
import { AppTheme, useAppStore } from "@/state/app.store";

export function SettingsAppearance(): JSX.Element {
  const theme = useAppStore((state: AppStateLike) => state.theme);
  const toggleTheme = useAppStore((state: AppStateLike) => state.toggleTheme);

  const isDark = theme === "dark";

  return (
    <button className="settings-appearance" onClick={toggleTheme} type="button">
      <div className="settings-appearance__icon-wrap">
        <Moon size={20} strokeWidth={1.9} />
      </div>

      <div className="settings-appearance__content">
        <span className="settings-appearance__title">Dark mode</span>
        <span className="settings-appearance__subtitle">
          Switch between light and dark appearance
        </span>
      </div>

      <div className="settings-appearance__meta">
        <span className="settings-appearance__value">{isDark ? "Dark" : "Light"}</span>
        {isDark ? <Moon size={18} strokeWidth={1.9} /> : <Sun size={18} strokeWidth={1.9} />}
        <ChevronRight size={18} strokeWidth={1.9} />
      </div>
    </button>
  );
}

interface AppStateLike {
  theme: AppTheme;
  toggleTheme: () => void;
}
