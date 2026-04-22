import { Goal } from "@/domains/goals/types";

export interface GoalDeadlineState {
  hasDeadline: boolean;
  isCompleted: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isWarning: boolean;
  daysRemaining: number | null;
  hoursRemaining: number | null;
  statusLabel: string;
  tone: "neutral" | "info" | "warning" | "danger" | "success";
  helperText: string;
  formattedDeadline: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function parseDeadline(deadline?: string): Date | null {
  if (!deadline?.trim()) {
    return null;
  }

  const trimmedDeadline = deadline.trim();

  // Treat date-only deadlines as local end-of-day so "Due today" remains intuitive.
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(trimmedDeadline)
    ? `${trimmedDeadline}T23:59:59`
    : trimmedDeadline;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDeadline(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function computeGoalDeadlineState(
  goal: Goal,
  now = new Date(),
): GoalDeadlineState {
  const deadlineDate = parseDeadline(goal.deadline);

  if (!deadlineDate) {
    return {
      hasDeadline: false,
      isCompleted: goal.status === "completed",
      isOverdue: false,
      isDueToday: false,
      isWarning: false,
      daysRemaining: null,
      hoursRemaining: null,
      statusLabel: "No deadline",
      tone: "neutral",
      helperText: "No deadline set yet.",
      formattedDeadline: null,
    };
  }

  const isCompleted = goal.status === "completed";
  const diffMs = deadlineDate.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const hoursRemaining = isOverdue
    ? Math.max(1, Math.ceil(Math.abs(diffMs) / HOUR_MS))
    : Math.max(0, Math.floor(diffMs / HOUR_MS));
  const daysRemaining = isOverdue
    ? Math.max(1, Math.ceil(Math.abs(diffMs) / DAY_MS))
    : Math.max(0, Math.ceil(diffMs / DAY_MS));
  const isDueToday =
    now.getFullYear() === deadlineDate.getFullYear() &&
    now.getMonth() === deadlineDate.getMonth() &&
    now.getDate() === deadlineDate.getDate() &&
    !isOverdue;
  const isWarning = !isOverdue && !isDueToday && diffMs <= 7 * DAY_MS;
  const formattedDeadline = formatDeadline(deadlineDate);

  if (isCompleted) {
    const completedOnTime = goal.updatedAt <= deadlineDate.getTime();

    return {
      hasDeadline: true,
      isCompleted: true,
      isOverdue: false,
      isDueToday: false,
      isWarning: false,
      daysRemaining: null,
      hoursRemaining: null,
      statusLabel: completedOnTime ? "Completed on time" : "Completed",
      tone: "success",
      helperText: completedOnTime
        ? "This goal was completed before the deadline."
        : "This goal is completed.",
      formattedDeadline,
    };
  }

  if (isOverdue) {
    return {
      hasDeadline: true,
      isCompleted: false,
      isOverdue: true,
      isDueToday: false,
      isWarning: false,
      daysRemaining: -daysRemaining,
      hoursRemaining,
      statusLabel:
        hoursRemaining < 24
          ? `Overdue by ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}`
          : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} overdue`,
      tone: "danger",
      helperText: "This goal is overdue.",
      formattedDeadline,
    };
  }

  if (isDueToday) {
    return {
      hasDeadline: true,
      isCompleted: false,
      isOverdue: false,
      isDueToday: true,
      isWarning: true,
      daysRemaining: 0,
      hoursRemaining,
      statusLabel: "Due today",
      tone: "warning",
      helperText: "Stay focused — deadline is approaching.",
      formattedDeadline,
    };
  }

  return {
    hasDeadline: true,
    isCompleted: false,
    isOverdue: false,
    isDueToday: false,
    isWarning,
    daysRemaining,
    hoursRemaining,
    statusLabel:
      hoursRemaining < 24
        ? `Due in ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}`
        : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`,
    tone: isWarning ? "warning" : "info",
    helperText: isWarning
      ? "Stay focused — deadline is approaching."
      : "The deadline is comfortably ahead.",
    formattedDeadline,
  };
}
