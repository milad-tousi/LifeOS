import { useEffect } from "react";
import { AppRoutes } from "@/app/routes";
import { AppShell } from "@/components/layout/AppShell";
import { AppState, useAppStore } from "@/state/app.store";

export function App(): JSX.Element {
  const theme = useAppStore((state: AppState) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
  );
}
