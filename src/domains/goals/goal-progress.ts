import { Task } from "@/domains/tasks/types";

export interface GoalTaskStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  progressPercent: number;
}

export function getGoalTaskStats(tasks: Task[]): GoalTaskStats {
  const cancelled = tasks.filter((task) => task.status === "cancelled").length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.filter((task) => task.status === "pending").length;
  const total = tasks.length - cancelled;

  return {
    total,
    completed,
    pending,
    cancelled,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function calculateGoalProgress(tasks: Task[]): number {
  return getGoalTaskStats(tasks).progressPercent;
}
