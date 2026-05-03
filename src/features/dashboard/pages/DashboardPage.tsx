import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tasksRepository } from "@/domains/tasks/repository";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardTabs } from "@/features/dashboard/components/DashboardTabs";
import { GoalMindMap } from "@/features/dashboard/components/GoalMindMap";
import { LifeScoreCard } from "@/features/dashboard/components/LifeScoreCard";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentActivityTimeline } from "@/features/dashboard/components/RecentActivityTimeline";
import { TodayPlanPanel } from "@/features/dashboard/components/TodayPlanPanel";
import { WeeklySnapshot } from "@/features/dashboard/components/WeeklySnapshot";
import { DashboardTab } from "@/features/dashboard/types/dashboard.types";
import { calculateDashboardStats } from "@/features/dashboard/utils/calculateDashboardStats";
import {
  loadGoalMindMapLayout,
  mergeGoalMindMapLayout,
} from "@/features/dashboard/utils/goalMindMapStorage";
import { useFinanceState } from "@/features/finance/hooks/useFinanceState";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { getReviews } from "@/features/reviews/services/review.storage";
import { useI18n } from "@/i18n";
import { formatAppDate, formatWeekRange } from "@/i18n/formatters";

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedGoalId, setSelectedGoalId] = useState(() => loadGoalMindMapLayout().selectedGoalId);
  const [reviews, setReviews] = useState(() => getReviews());
  const { tasks } = useTasks();
  const { habits, logs, updateTodayLog, deleteHabitLogForDate } = useHabits();
  const { goals } = useGoals();
  const { budgetUsage, settings, transactions } = useFinanceState();

  useEffect(() => {
    setReviews(getReviews());
  }, [activeTab]);

  useEffect(() => {
    if (selectedGoalId && !goals.some((goal) => goal.goal.id === selectedGoalId)) {
      setSelectedGoalId("");
      mergeGoalMindMapLayout({ selectedGoalId: "" });
    }
  }, [goals, selectedGoalId]);

  const stats = useMemo(
    () =>
      calculateDashboardStats({
        budgetUsage,
        currency: settings.currency,
        goals,
        habits,
        habitLogs: logs,
        reviews,
        selectedGoalId,
        tasks,
        transactions,
      }),
    [budgetUsage, goals, habits, logs, reviews, selectedGoalId, settings.currency, tasks, transactions],
  );

  async function handleToggleTask(taskId: string): Promise<void> {
    await tasksRepository.toggleTaskComplete(taskId);
  }

  function handleToggleHabit(habitId: string, _periodKey: string, completed: boolean): void {
    if (completed) {
      deleteHabitLogForDate(habitId, getDateKey(new Date()));
      return;
    }

    updateTodayLog(habitId, 1);
  }

  function handleSelectGoal(goalId: string): void {
    setSelectedGoalId(goalId);
    mergeGoalMindMapLayout({ selectedGoalId: goalId });
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        <div className="dashboard-date-card">
          <span>{t("dashboard.todayPlan")}</span>
          <strong>{formatAppDate(new Date(), language)}</strong>
          <p>{formatCurrentWeek(language)}</p>
        </div>
      </header>

      <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="dashboard-tab-panel">
          <DashboardSummaryCards currency={settings.currency} summary={stats.summary} />
          <div className="dashboard-overview-grid">
            <LifeScoreCard score={stats.lifeScore} />
            <QuickActions onNavigate={navigate} />
          </div>
          <WeeklySnapshot currency={settings.currency} snapshot={stats.weeklySnapshot} />
        </div>
      ) : null}

      {activeTab === "today" ? (
        <TodayPlanPanel
          onCompleteHabit={handleToggleHabit}
          onNavigate={navigate}
          onToggleTask={(taskId) => {
            void handleToggleTask(taskId);
          }}
          plan={stats.todayPlan}
        />
      ) : null}

      {activeTab === "mind-map" ? (
        <GoalMindMap
          goals={goals}
          onNavigateToGoals={() => navigate("/goals")}
          onSelectGoal={handleSelectGoal}
          selectedGoalId={selectedGoalId}
          tasks={tasks}
        />
      ) : null}

      {activeTab === "activity" ? (
        <RecentActivityTimeline items={stats.activity} onNavigate={navigate} />
      ) : null}
    </div>
  );
}

function formatCurrentWeek(language: "en" | "fa"): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = language === "fa" ? (start.getDay() + 1) % 7 : start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + (language === "fa" ? 0 : 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return formatWeekRange(start, end, language);
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
