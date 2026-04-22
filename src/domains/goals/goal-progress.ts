import { normalizeGoal } from "@/domains/goals/goal.utils";
import { Goal } from "@/domains/goals/types";
import { Task, TaskSubtask } from "@/domains/tasks/types";

export interface GoalProgressSnapshot {
  percentage: number;
  completed: number;
  total: number;
  label: string;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSafeTasks(tasks?: Task[]): Task[] {
  return Array.isArray(tasks) ? tasks : [];
}

function getSafeSubtasks(tasks: Task[]): TaskSubtask[] {
  return tasks.flatMap((task) => (Array.isArray(task.subtasks) ? task.subtasks : []));
}

export function computeTasksProgress(tasks?: Task[]): GoalProgressSnapshot {
  const safeTasks = getSafeTasks(tasks);
  const total = safeTasks.filter((task) => task.status !== "cancelled").length;
  const completed = safeTasks.filter((task) => task.status === "done").length;

  return {
    percentage: total > 0 ? clampPercentage((completed / total) * 100) : 0,
    completed,
    total,
    label: total > 0 ? `${completed} of ${total} tasks completed` : "No steps yet",
  };
}

export function computeSubtasksProgress(tasks?: Task[]): GoalProgressSnapshot {
  const safeTasks = getSafeTasks(tasks);
  const subtasks = getSafeSubtasks(safeTasks);

  if (subtasks.length === 0) {
    return computeTasksProgress(safeTasks);
  }

  const total = subtasks.length;
  const completed = subtasks.filter((subtask) => subtask.completed).length;

  return {
    percentage: total > 0 ? clampPercentage((completed / total) * 100) : 0,
    completed,
    total,
    label: `${completed} of ${total} subtasks completed`,
  };
}

export function computeManualProgress(goal: Goal): GoalProgressSnapshot {
  const manualProgress = clampPercentage(goal.manualProgress ?? 0);

  return {
    percentage: manualProgress,
    completed: manualProgress,
    total: 100,
    label: `${manualProgress}% complete`,
  };
}

export function computeTargetProgress(goal: Goal): GoalProgressSnapshot {
  const normalizedTargetValue =
    typeof goal.targetValue === "number" && Number.isFinite(goal.targetValue)
      ? goal.targetValue
      : 0;
  const normalizedCurrentValue =
    typeof goal.currentValue === "number" && Number.isFinite(goal.currentValue)
      ? Math.max(0, goal.currentValue)
      : 0;
  const targetValue = normalizedTargetValue > 0 ? normalizedTargetValue : 0;
  const total = goal.targetType === "binary" && targetValue <= 0 ? 1 : targetValue;
  const completed = goal.targetType === "binary" ? (normalizedCurrentValue > 0 ? 1 : 0) : normalizedCurrentValue;

  return {
    percentage: total > 0 ? clampPercentage((completed / total) * 100) : 0,
    completed,
    total,
    label: total > 0 ? `${completed} / ${total}` : "0 / 0",
  };
}

export function computeGoalProgress(goal: Goal, tasks?: Task[]): GoalProgressSnapshot {
  const normalizedGoal = normalizeGoal(goal);

  switch (normalizedGoal.progressType) {
    case "manual":
      return computeManualProgress(normalizedGoal);
    case "target":
      return computeTargetProgress(normalizedGoal);
    case "subtasks":
      return computeSubtasksProgress(tasks);
    case "tasks":
    default:
      return computeTasksProgress(tasks);
  }
}
