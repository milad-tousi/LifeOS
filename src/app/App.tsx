import { useEffect } from "react";
import { AppRoutes } from "@/app/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function App(): JSX.Element {
  const { restoreSession } = useAuth();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return <AppRoutes />;
}
