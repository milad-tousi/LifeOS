import { GoalStatus } from "@/domains/goals/types";
import { TaskPriority, TaskStatus } from "@/domains/tasks/types";
import { FinanceCurrency } from "@/features/finance/types/finance.types";

export type DashboardTab = "overview" | "today" | "mind-map" | "activity";

export interface DashboardSummary {
  finance: {
    budgetWarnings: number;
    expensesThisMonth: number;
    incomeThisMonth: number;
    netSavingsThisMonth: number;
  };
  goals: {
    activeGoals: number;
    averageProgress: number;
    needingAttention: number;
    recentlyUpdatedGoal?: string;
  };
  habits: {
    activeHabits: number;
    completedToday: number;
    scheduledToday: number;
    todayCompletionRate: number;
  };
  reviews: {
    dailyReviewCompleted: boolean;
    reviewStreak: number;
    weeklyReviewCompleted: boolean;
  };
  tasks: {
    completedThisWeek: number;
    dueToday: number;
    overdue: number;
    total: number;
  };
}

export interface TodayPlanTask {
  dueDate?: string;
  id: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}

export interface TodayPlanHabit {
  completed: boolean;
  id: string;
  periodKey: string;
  title: string;
  value: number;
}

export interface TodayPlanGoal {
  id: string;
  progress: number;
  status: GoalStatus;
  title: string;
}

export interface TodayPlan {
  dailyReviewCompleted: boolean;
  goalsNeedingProgress: TodayPlanGoal[];
  habitsScheduledToday: TodayPlanHabit[];
  overdueTasks: TodayPlanTask[];
  tasksDueToday: TodayPlanTask[];
}

export interface WeeklySnapshot {
  financeNet: number;
  goalProgressAverage: number;
  habitCompletionRate: number;
  reviewsCompleted: number;
  tasksCompleted: number;
}

export interface LifeOSScore {
  availableSignals: number;
  explanation: string;
  score: number;
  signals: Array<{ label: string; value: number }>;
}

export interface DashboardActivityItem {
  date: string;
  id: string;
  label: string;
  module: "Tasks" | "Habits" | "Goals" | "Finance" | "Reviews";
  route: string;
  text: string;
  type: "created" | "completed" | "updated" | "added" | "saved";
}

export interface GoalMindMapNodeData {
  dueDate?: string;
  goalId?: string;
  isOverdue?: boolean;
  isPlaceholder?: boolean;
  priority?: TaskPriority;
  progress?: number;
  status?: GoalStatus | TaskStatus;
  taskId?: string;
  title: string;
}

export interface GoalMindMapTask {
  dueDate?: string;
  id: string;
  isOverdue: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
}

export interface GoalMindMapData {
  goal?: {
    id: string;
    progress: number;
    status: GoalStatus;
    title: string;
  };
  tasks: GoalMindMapTask[];
}

export interface DashboardStats {
  activity: DashboardActivityItem[];
  currency: FinanceCurrency;
  goalMindMap: GoalMindMapData;
  lifeScore: LifeOSScore;
  summary: DashboardSummary;
  todayPlan: TodayPlan;
  weeklySnapshot: WeeklySnapshot;
}
