import { db } from "@/db/dexie";
import { useLiveQuerySafe } from "@/hooks/useLiveQuerySafe";

export interface DashboardData {
  taskCount: number;
  habitCount: number;
  goalCount: number;
  expenseCount: number;
}

export function useDashboardData(): DashboardData {
  const data = useLiveQuerySafe(
    async () => ({
      taskCount: await db.tasks.count(),
      habitCount: await db.habits.count(),
      goalCount: await db.goals.count(),
      expenseCount: await db.expenses.count(),
    }),
    [],
    {
      taskCount: 0,
      habitCount: 0,
      goalCount: 0,
      expenseCount: 0,
    },
  );

  return data;
}

