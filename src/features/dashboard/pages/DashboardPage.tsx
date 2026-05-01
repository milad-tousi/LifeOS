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
import { useFinanceState } from "@/features/finance/hooks/useFinanceState";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { getReviews } from "@/features/reviews/services/review.storage";

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedGoalId, setSelectedGoalId] = useState("");
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

  async function handleLinkTasks(taskIds: string[]): Promise<void> {
    if (!selectedGoalId) {
      return;
    }

    await Promise.all(
      tasks
        .filter((task) => taskIds.includes(task.id))
        .map((task) => tasksRepository.update({ ...task, goalId: selectedGoalId })),
    );
  }

  async function handleCreateMindMapTask(input: {
    dueDate?: string;
    priority: "low" | "medium" | "high";
    title: string;
  }): Promise<void> {
    if (!selectedGoalId) {
      return;
    }

    await tasksRepository.add({
      dueDate: input.dueDate,
      goalId: selectedGoalId,
      priority: input.priority,
      status: "todo",
      title: input.title,
    });
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>A local-first command center for today’s tasks, habits, goals, finance, and reviews.</p>
        </div>
        <div className="dashboard-date-card">
          <span>Today</span>
          <strong>{formatTodayDate()}</strong>
          <p>{formatCurrentWeek()}</p>
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
          data={stats.goalMindMap}
          goals={goals}
          onCreateTask={(input) => {
            void handleCreateMindMapTask(input);
          }}
          onLinkTasks={(taskIds) => {
            void handleLinkTasks(taskIds);
          }}
          onSelectGoal={setSelectedGoalId}
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

function formatTodayDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date());
}

function formatCurrentWeek(): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date);
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
