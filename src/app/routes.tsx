import { Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { TasksPage } from "@/features/tasks/pages/TasksPage";
import { HabitsPage } from "@/features/habits/pages/HabitsPage";
import { GoalsPage } from "@/features/goals/pages/GoalsPage";
import { FinancePage } from "@/features/finance/pages/FinancePage";
import { HealthPage } from "@/features/health/pages/HealthPage";
import { ReviewsPage } from "@/features/reviews/pages/ReviewsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/habits" element={<HabitsPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/finance" element={<FinancePage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
