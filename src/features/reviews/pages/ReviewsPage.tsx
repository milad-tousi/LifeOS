import { useMemo, useState } from "react";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { Task } from "@/domains/tasks/types";
import { DailyReviewForm } from "@/features/reviews/components/DailyReviewForm";
import { ReflectionInsights } from "@/features/reviews/components/ReflectionInsights";
import { ReviewHistory } from "@/features/reviews/components/ReviewHistory";
import {
  ReviewSnapshot,
  ReviewSnapshotCards,
} from "@/features/reviews/components/ReviewSnapshotCards";
import { ReviewTypeTabs } from "@/features/reviews/components/ReviewTypeTabs";
import { WeeklyReviewForm } from "@/features/reviews/components/WeeklyReviewForm";
import { useFinanceState } from "@/features/finance/hooks/useFinanceState";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useHabits } from "@/features/habits/hooks/useHabits";
import {
  getScheduledDateKeysBetween,
  isHabitLogCompletedForPeriod,
} from "@/features/habits/utils/habit.utils";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import {
  createDailyReview,
  createWeeklyReview,
  getDayRange,
  getMonthRange,
  getReviews,
  getWeekRange,
  hasDailyReviewForDate,
  hasWeeklyReviewForDate,
} from "@/features/reviews/services/review.storage";
import {
  DailyReviewInput,
  ReviewEntry,
  ReviewType,
  WeeklyReviewInput,
} from "@/features/reviews/types/review.types";

export function ReviewsPage(): JSX.Element {
  const [activeType, setActiveType] = useState<ReviewType>("daily");
  const [reviews, setReviews] = useState<ReviewEntry[]>(() => getReviews());
  const [dailyComplete, setDailyComplete] = useState(() => hasDailyReviewForDate());
  const [weeklyComplete, setWeeklyComplete] = useState(() => hasWeeklyReviewForDate());
  const { tasks } = useTasks();
  const { habits, logs } = useHabits();
  const { goals } = useGoals();
  const { settings, transactions } = useFinanceState();
  const snapshotPeriod = getSnapshotPeriod(activeType);
  const snapshot = useMemo(
    () =>
      calculateReviewSnapshot({
        activeType,
        goals,
        habits,
        logs,
        tasks,
        transactions,
      }),
    [activeType, goals, habits, logs, tasks, transactions],
  );

  function refreshReviews(): void {
    setReviews(getReviews());
    setDailyComplete(hasDailyReviewForDate());
    setWeeklyComplete(hasWeeklyReviewForDate());
  }

  function handleDailySubmit(input: DailyReviewInput): string | null {
    try {
      createDailyReview(input);
      refreshReviews();
      return null;
    } catch (error) {
      refreshReviews();
      return error instanceof Error ? error.message : "Daily review could not be saved.";
    }
  }

  function handleWeeklySubmit(input: WeeklyReviewInput): string | null {
    try {
      createWeeklyReview(input);
      refreshReviews();
      return null;
    } catch (error) {
      refreshReviews();
      return error instanceof Error ? error.message : "Weekly review could not be saved.";
    }
  }

  return (
    <div className="reviews-page">
      <ScreenHeader
        title="Reviews"
        description="Reflect on your days and weeks with progress signals from tasks, habits, goals, and finance."
      />

      <ReviewTypeTabs activeType={activeType} onChange={setActiveType} />

      <div className="reviews-page__period">
        <span>Current reflection period</span>
        <strong>{snapshotPeriod.label}</strong>
      </div>

      <ReviewSnapshotCards currency={settings.currency} snapshot={snapshot} />

      {activeType === "daily" ? (
        <DailyReviewForm isComplete={dailyComplete} onSubmit={handleDailySubmit} />
      ) : null}

      {activeType === "weekly" ? (
        <WeeklyReviewForm isComplete={weeklyComplete} onSubmit={handleWeeklySubmit} />
      ) : null}

      {activeType === "monthly" ? (
        <section className="review-card">
          <div className="review-empty-state review-empty-state--monthly">
            <strong>Monthly review is coming next</strong>
            <p>
              Monthly reflections will build on the same history and snapshot system. Daily
              and weekly reviews are ready now.
            </p>
          </div>
        </section>
      ) : null}

      <ReviewHistory reviews={reviews} />
      <ReflectionInsights reviews={reviews} />
    </div>
  );
}

function calculateReviewSnapshot({
  activeType,
  goals,
  habits,
  logs,
  tasks,
  transactions,
}: {
  activeType: ReviewType;
  goals: ReturnType<typeof useGoals>["goals"];
  habits: ReturnType<typeof useHabits>["habits"];
  logs: ReturnType<typeof useHabits>["logs"];
  tasks: Task[];
  transactions: ReturnType<typeof useFinanceState>["transactions"];
}): ReviewSnapshot {
  const period = getSnapshotPeriod(activeType);
  const activeGoals = goals.filter((goal) => goal.goal.status === "active");
  const goalProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((total, goal) => total + goal.overallProgress, 0) /
            activeGoals.length,
        )
      : 0;

  return {
    tasksCompleted: calculateCompletedTasks(tasks, period.start, period.end),
    habitCompletionRate: calculateHabitCompletionRate(habits, logs, period.start, period.end),
    goalProgress,
    netFinance: calculateNetFinance(transactions, period.start, period.end),
  };
}

function calculateCompletedTasks(tasks: Task[], start: Date, end: Date): number {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return tasks.filter((task) => {
    if (task.status !== "done") {
      return false;
    }

    const completedAt = task.completedAt ?? task.updatedAt;
    return completedAt >= startTime && completedAt <= endTime;
  }).length;
}

function calculateHabitCompletionRate(
  habits: ReturnType<typeof useHabits>["habits"],
  logs: ReturnType<typeof useHabits>["logs"],
  start: Date,
  end: Date,
): number {
  const scheduledPeriods = habits.flatMap((habit) =>
    getScheduledDateKeysBetween(habit, start, end).map((periodKey) => ({ habit, periodKey })),
  );

  if (scheduledPeriods.length === 0) {
    return 0;
  }

  const completedPeriods = scheduledPeriods.filter(({ habit, periodKey }) =>
    isHabitLogCompletedForPeriod(habit, logs, periodKey),
  ).length;

  return Math.round((completedPeriods / scheduledPeriods.length) * 100);
}

function calculateNetFinance(
  transactions: ReturnType<typeof useFinanceState>["transactions"],
  start: Date,
  end: Date,
): number {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  return transactions
    .filter((transaction) => transaction.date >= startKey && transaction.date <= endKey)
    .reduce(
      (total, transaction) =>
        total + (transaction.type === "income" ? transaction.amount : -transaction.amount),
      0,
    );
}

function getSnapshotPeriod(type: ReviewType): { end: Date; label: string; start: Date } {
  if (type === "daily") {
    return getDayRange();
  }

  if (type === "weekly") {
    return getWeekRange();
  }

  return getMonthRange();
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
