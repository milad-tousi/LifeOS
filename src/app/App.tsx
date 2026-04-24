import { useEffect } from "react";
import { AppRoutes } from "@/app/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  startHabitReminderScheduler,
  stopHabitReminderScheduler,
} from "@/services/habitReminderScheduler";

export function App(): JSX.Element {
  const { restoreSession } = useAuth();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    startHabitReminderScheduler();

    return () => {
      stopHabitReminderScheduler();
    };
  }, []);

  return <AppRoutes />;
}
