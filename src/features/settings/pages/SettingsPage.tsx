import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { AppState, useAppStore } from "@/state/app.store";

export function SettingsPage(): JSX.Element {
  const theme = useAppStore((state: AppState) => state.theme);
  const toggleTheme = useAppStore((state: AppState) => state.toggleTheme);

  return (
    <>
      <ScreenHeader
        title="Settings"
        description="Settings start with a lightweight local theme preference."
      />
      <Card title="Appearance">
        <div className="page-list">
          <div className="page-list__item">
            <span>Theme</span>
            <strong>{theme}</strong>
          </div>
        </div>
        <Button variant="secondary" onClick={toggleTheme}>
          Toggle Theme
        </Button>
      </Card>
    </>
  );
}
