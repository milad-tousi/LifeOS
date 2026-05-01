import { Habit, HabitLog } from "@/domains/habits/types";
import { Task } from "@/domains/tasks/types";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import { FinanceCurrency, FinanceTransaction } from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";
import { ReviewEntry } from "@/features/reviews/types/review.types";
import {
  getDateKey,
  getHabitCurrentPeriodKey,
  getScheduledDateKeysBetween,
  isHabitActiveOnDate,
  isHabitLogCompletedForPeriod,
} from "@/features/habits/utils/habit.utils";
import {
  DashboardActivityItem,
  DashboardStats,
  GoalMindMapData,
  LifeOSScore,
  TodayPlan,
  WeeklySnapshot,
} from "@/features/dashboard/types/dashboard.types";

interface CalculateDashboardStatsInput {
  budgetUsage: MonthlyBudgetUsage[];
  currency: FinanceCurrency;
  goals: GoalCardData[];
  habits: Habit[];
  habitLogs: HabitLog[];
  reviews: ReviewEntry[];
  selectedGoalId?: string;
  tasks: Task[];
  transactions: FinanceTransaction[];
  now?: Date;
}

interface DateRange {
  end: Date;
  start: Date;
}

export function calculateDashboardStats({
  budgetUsage,
  currency,
  goals,
  habits,
  habitLogs,
  now = new Date(),
  reviews,
  selectedGoalId,
  tasks,
  transactions,
}: CalculateDashboardStatsInput): DashboardStats {
  const todayKey = getDateKey(now);
  const week = getWeekRange(now);
  const month = getMonthRange(now);
  const incompleteTasks = tasks.filter((task) => task.status !== "done" && task.status !== "cancelled");
  const tasksCompletedThisWeek = tasks.filter((task) =>
    task.status === "done" && isTimestampInRange(task.completedAt ?? task.updatedAt, week),
  ).length;
  const scheduledHabitsToday = getScheduledHabits(habits, habitLogs, now);
  const habitWeekRate = calculateHabitCompletionRate(habits, habitLogs, week);
  const activeGoals = goals.filter((goal) => goal.goal.status === "active");
  const averageGoalProgress = average(activeGoals.map((goal) => goal.overallProgress));
  const monthTransactions = transactions.filter((transaction) => isDateKeyInRange(transaction.date, month));
  const reviewsThisWeek = reviews.filter((review) => isIsoDateInRange(review.createdAt, week)).length;
  const dailyReviewCompleted = reviews.some(
    (review) => review.type === "daily" && review.periodKey === todayKey,
  );
  const weeklyReviewCompleted = reviews.some(
    (review) => review.type === "weekly" && review.periodKey === `week-${getDateKey(week.start)}`,
  );
  const summary = {
    tasks: {
      total: tasks.length,
      dueToday: incompleteTasks.filter((task) => task.dueDate === todayKey || task.scheduledDate === todayKey).length,
      overdue: incompleteTasks.filter((task) => isTaskOverdue(task, todayKey)).length,
      completedThisWeek: tasksCompletedThisWeek,
    },
    habits: {
      activeHabits: habits.filter((habit) => !habit.archived).length,
      scheduledToday: scheduledHabitsToday.length,
      completedToday: scheduledHabitsToday.filter((habit) => habit.completed).length,
      todayCompletionRate: getRate(
        scheduledHabitsToday.filter((habit) => habit.completed).length,
        scheduledHabitsToday.length,
      ),
    },
    goals: {
      activeGoals: activeGoals.length,
      averageProgress: averageGoalProgress,
      needingAttention: activeGoals.filter((goal) => goal.overallProgress < 25 || !goal.nextPendingTask).length,
      recentlyUpdatedGoal: goals
        .slice()
        .sort((left, right) => right.goal.updatedAt - left.goal.updatedAt)[0]?.goal.title,
    },
    finance: {
      incomeThisMonth: sumTransactions(monthTransactions, "income"),
      expensesThisMonth: sumTransactions(monthTransactions, "expense"),
      netSavingsThisMonth:
        sumTransactions(monthTransactions, "income") - sumTransactions(monthTransactions, "expense"),
      budgetWarnings: budgetUsage.filter((budget) => budget.percentageUsed >= 70).length,
    },
    reviews: {
      dailyReviewCompleted,
      weeklyReviewCompleted,
      reviewStreak: calculateDailyReviewStreak(reviews, now),
    },
  };
  const todayPlan: TodayPlan = {
    tasksDueToday: incompleteTasks
      .filter((task) => task.dueDate === todayKey || task.scheduledDate === todayKey)
      .map(toTodayPlanTask),
    overdueTasks: incompleteTasks.filter((task) => isTaskOverdue(task, todayKey)).map(toTodayPlanTask),
    habitsScheduledToday: scheduledHabitsToday,
    goalsNeedingProgress: activeGoals
      .filter((goal) => goal.overallProgress < 35 || !goal.nextPendingTask)
      .slice(0, 6)
      .map((goal) => ({
        id: goal.goal.id,
        progress: goal.overallProgress,
        status: goal.goal.status,
        title: goal.goal.title,
      })),
    dailyReviewCompleted,
  };
  const weeklySnapshot: WeeklySnapshot = {
    tasksCompleted: tasksCompletedThisWeek,
    habitCompletionRate: habitWeekRate,
    goalProgressAverage: averageGoalProgress,
    financeNet: calculateFinanceNet(transactions, week),
    reviewsCompleted: reviewsThisWeek,
  };

  return {
    activity: calculateRecentActivity({ goals, habitLogs, reviews, tasks, transactions }),
    currency,
    goalMindMap: calculateGoalMindMap(goals, tasks, selectedGoalId, todayKey),
    lifeScore: calculateLifeOSScore({
      activeGoalsAverage: averageGoalProgress,
      budgetHealthRate: getRate(
        budgetUsage.filter((budget) => budget.percentageUsed < 70).length,
        budgetUsage.length,
      ),
      habitRate: scheduledHabitsToday.length > 0 ? summary.habits.todayCompletionRate : habitWeekRate,
      reviewRate: getRate(
        [dailyReviewCompleted, weeklyReviewCompleted].filter(Boolean).length,
        2,
      ),
      taskRate: getTaskCompletionRate(tasks, week),
    }),
    summary,
    todayPlan,
    weeklySnapshot,
  };
}

function calculateLifeOSScore(input: {
  activeGoalsAverage: number;
  budgetHealthRate: number | null;
  habitRate: number;
  reviewRate: number;
  taskRate: number | null;
}): LifeOSScore {
  const signals = [
    input.taskRate === null ? null : { label: "Task completion", value: input.taskRate },
    { label: "Habit completion", value: input.habitRate },
    { label: "Goal progress", value: input.activeGoalsAverage },
    { label: "Review rhythm", value: input.reviewRate },
    input.budgetHealthRate === null ? null : { label: "Budget health", value: input.budgetHealthRate },
  ].filter((signal): signal is { label: string; value: number } => signal !== null);
  const score = signals.length > 0 ? Math.round(average(signals.map((signal) => signal.value))) : 0;
  const strongestSignal = signals.slice().sort((left, right) => right.value - left.value)[0];
  const weakestSignal = signals.slice().sort((left, right) => left.value - right.value)[0];

  return {
    availableSignals: signals.length,
    explanation:
      signals.length === 0
        ? "Add tasks, habits, goals, reviews, or budgets to activate your score."
        : `${strongestSignal.label} is helping most; ${weakestSignal.label} has the most room to improve.`,
    score,
    signals,
  };
}

function calculateGoalMindMap(
  goals: GoalCardData[],
  tasks: Task[],
  selectedGoalId: string | undefined,
  todayKey: string,
): GoalMindMapData {
  const goal = goals.find((item) => item.goal.id === selectedGoalId);

  if (!goal) {
    return { tasks: [] };
  }

  return {
    goal: {
      id: goal.goal.id,
      progress: goal.overallProgress,
      status: goal.goal.status,
      title: goal.goal.title,
    },
    tasks: tasks
      .filter((task) => task.goalId === goal.goal.id)
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        isOverdue: isTaskOverdue(task, todayKey),
      })),
  };
}

function calculateRecentActivity({
  goals,
  habitLogs,
  reviews,
  tasks,
  transactions,
}: {
  goals: GoalCardData[];
  habitLogs: HabitLog[];
  reviews: ReviewEntry[];
  tasks: Task[];
  transactions: FinanceTransaction[];
}): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [
    ...tasks.flatMap((task) => [
      {
        id: `task-created-${task.id}`,
        date: new Date(task.createdAt).toISOString(),
        label: "Tasks",
        module: "Tasks" as const,
        route: "/tasks",
        text: `Created task: ${task.title}`,
        type: "created" as const,
      },
      ...(task.completedAt
        ? [{
            id: `task-completed-${task.id}`,
            date: new Date(task.completedAt).toISOString(),
            label: "Tasks",
            module: "Tasks" as const,
            route: "/tasks",
            text: `Completed task: ${task.title}`,
            type: "completed" as const,
          }]
        : []),
    ]),
    ...goals.map((goal) => ({
      id: `goal-updated-${goal.goal.id}`,
      date: new Date(goal.goal.updatedAt).toISOString(),
      label: "Goals",
      module: "Goals" as const,
      route: `/goals/${goal.goal.id}`,
      text: `Updated goal: ${goal.goal.title}`,
      type: "updated" as const,
    })),
    ...habitLogs
      .filter((log) => log.completed)
      .map((log) => ({
        id: `habit-log-${log.id}`,
        date: log.updatedAt,
        label: "Habits",
        module: "Habits" as const,
        route: "/habits",
        text: "Completed a habit",
        type: "completed" as const,
      })),
    ...transactions.map((transaction) => ({
      id: `finance-${transaction.id}`,
      date: transaction.createdAt,
      label: "Finance",
      module: "Finance" as const,
      route: "/finance",
      text: `Added ${transaction.type}: ${transaction.merchant}`,
      type: "added" as const,
    })),
    ...reviews.map((review) => ({
      id: `review-${review.id}`,
      date: review.createdAt,
      label: "Reviews",
      module: "Reviews" as const,
      route: "/reviews",
      text: `Saved ${review.type} review`,
      type: "saved" as const,
    })),
  ];

  return items
    .filter((item) => !Number.isNaN(new Date(item.date).getTime()))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 16);
}

function getScheduledHabits(habits: Habit[], logs: HabitLog[], date: Date) {
  return habits
    .filter((habit) => isHabitActiveOnDate(habit, date))
    .map((habit) => {
      const periodKey = getHabitCurrentPeriodKey(habit, date) ?? getDateKey(date);
      const completed = isHabitLogCompletedForPeriod(habit, logs, periodKey);
      return { id: habit.id, title: habit.title, completed, periodKey, value: completed ? habit.target : 1 };
    });
}

function calculateHabitCompletionRate(habits: Habit[], logs: HabitLog[], range: DateRange): number {
  const scheduledPeriods = habits.flatMap((habit) =>
    getScheduledDateKeysBetween(habit, range.start, range.end).map((periodKey) => ({ habit, periodKey })),
  );

  return getRate(
    scheduledPeriods.filter(({ habit, periodKey }) =>
      isHabitLogCompletedForPeriod(habit, logs, periodKey),
    ).length,
    scheduledPeriods.length,
  );
}

function getTaskCompletionRate(tasks: Task[], range: DateRange): number | null {
  const touchedTasks = tasks.filter((task) => isTimestampInRange(task.updatedAt, range));
  if (touchedTasks.length === 0) {
    return null;
  }

  return getRate(touchedTasks.filter((task) => task.status === "done").length, touchedTasks.length);
}

function calculateDailyReviewStreak(reviews: ReviewEntry[], now: Date): number {
  const dailyReviewDates = new Set(
    reviews.filter((review) => review.type === "daily").map((review) => review.periodKey),
  );
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (dailyReviewDates.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toTodayPlanTask(task: Task) {
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ?? task.scheduledDate,
  };
}

function isTaskOverdue(task: Task, todayKey: string): boolean {
  const dueDate = task.dueDate ?? task.scheduledDate;
  return Boolean(dueDate && dueDate < todayKey && task.status !== "done" && task.status !== "cancelled");
}

function calculateFinanceNet(transactions: FinanceTransaction[], range: DateRange): number {
  return transactions
    .filter((transaction) => isDateKeyInRange(transaction.date, range))
    .reduce(
      (total, transaction) =>
        total + (transaction.type === "income" ? transaction.amount : -transaction.amount),
      0,
    );
}

function sumTransactions(transactions: FinanceTransaction[], type: "income" | "expense"): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getWeekRange(date: Date): DateRange {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date: Date): DateRange {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

function isTimestampInRange(timestamp: number | undefined, range: DateRange): boolean {
  if (!timestamp) {
    return false;
  }

  return timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
}

function isIsoDateInRange(value: string, range: DateRange): boolean {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
}

function isDateKeyInRange(value: string, range: DateRange): boolean {
  const startKey = getDateKey(range.start);
  const endKey = getDateKey(range.end);
  return value >= startKey && value <= endKey;
}

function getRate(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function average(values: number[]): number {
  return values.length > 0 ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
}
