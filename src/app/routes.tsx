import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";
import { SignupPage } from "@/features/onboarding/pages/SignupPage";
import { TasksPage } from "@/features/tasks/pages/TasksPage";
import { HabitsPage } from "@/features/habits/pages/HabitsPage";
import { GoalsPage } from "@/features/goals/pages/GoalsPage";
import { FinancePage } from "@/features/finance/pages/FinancePage";
import { HealthPage } from "@/features/health/pages/HealthPage";
import { ReviewsPage } from "@/features/reviews/pages/ReviewsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<PublicPage page="login" />} />
      <Route path="/signup" element={<PublicPage page="signup" />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

function PublicPage({ page }: { page: "login" | "signup" }): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  return page === "login" ? <LoginPage isAuthenticated={isAuthenticated} /> : <SignupPage />;
}
