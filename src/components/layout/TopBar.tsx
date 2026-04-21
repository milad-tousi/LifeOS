import { Button } from "@/components/common/Button";
import { AppState, useAppStore } from "@/state/app.store";

export function TopBar(): JSX.Element {
  const theme = useAppStore((state: AppState) => state.theme);
  const toggleTheme = useAppStore((state: AppState) => state.toggleTheme);

  return (
    <header className="topbar">
      <div>
        <div className="topbar__eyebrow">Local-first personal system</div>
        <h1 className="topbar__title">LifeOS</h1>
      </div>
      <Button variant="ghost" onClick={toggleTheme}>
        {theme === "light" ? "Dark" : "Light"}
      </Button>
    </header>
  );
}
