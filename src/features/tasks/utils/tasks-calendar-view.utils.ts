import { Task } from "@/domains/tasks/types";

export interface CalendarDay {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
}

export interface CalendarDayState {
  completedTaskCount: number;
  hasTasks: boolean;
  isDueSoon: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  openTaskCount: number;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function getCalendarWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function getMonthGrid(monthDate: Date): CalendarDay[] {
  const monthStart = getStartOfMonth(monthDate);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);

    return {
      date,
      key: toCalendarDateKey(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
    };
  });
}

export function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((accumulator, task) => {
    const key = getTaskCalendarDateKey(task);

    if (!key) {
      return accumulator;
    }

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(task);
    return accumulator;
  }, {});
}

export function getTasksForCalendarDate(
  tasksByDate: Record<string, Task[]>,
  date: Date,
): Task[] {
  return tasksByDate[toCalendarDateKey(date)] ?? [];
}

export function sortCalendarTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    const leftStatusWeight = left.status === "done" ? 1 : 0;
    const rightStatusWeight = right.status === "done" ? 1 : 0;

    if (leftStatusWeight !== rightStatusWeight) {
      return leftStatusWeight - rightStatusWeight;
    }

    const leftPriorityWeight = getPriorityWeight(left.priority);
    const rightPriorityWeight = getPriorityWeight(right.priority);

    if (leftPriorityWeight !== rightPriorityWeight) {
      return rightPriorityWeight - leftPriorityWeight;
    }

    return right.createdAt - left.createdAt;
  });
}

export function getDayTaskState(date: Date, tasks: Task[], now = new Date()): CalendarDayState {
  const openTasks = tasks.filter((task) => task.status !== "done");
  const completedTaskCount = tasks.length - openTasks.length;
  const isToday = isSameDay(date, now);
  const startOfToday = getStartOfDay(now);
  const startOfDate = getStartOfDay(date);
  const daysUntil = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  return {
    completedTaskCount,
    hasTasks: tasks.length > 0,
    isDueSoon: openTasks.length > 0 && daysUntil > 0 && daysUntil <= 7,
    isDueToday: openTasks.length > 0 && isToday,
    isOverdue: openTasks.length > 0 && startOfDate.getTime() < startOfToday.getTime(),
    openTaskCount: openTasks.length,
  };
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function toCalendarDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCalendarMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatSelectedDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTaskDateTime(task: Task): string | null {
  const taskDate = getTaskCalendarDate(task);

  if (!taskDate) {
    return null;
  }

  const scheduledTime = task.scheduledAt ? new Date(task.scheduledAt) : null;
  const hasScheduledTime = scheduledTime && !Number.isNaN(scheduledTime.getTime());

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    ...(hasScheduledTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
        }
      : {}),
  }).format(hasScheduledTime ? scheduledTime : taskDate);
}

export function getTaskCalendarDate(task: Task): Date | null {
  const rawDueDate = task.dueDate ?? task.scheduledDate;

  if (!rawDueDate) {
    return null;
  }

  const safeDate = new Date(`${rawDueDate}T12:00:00`);
  return Number.isNaN(safeDate.getTime()) ? null : safeDate;
}

function getTaskCalendarDateKey(task: Task): string | null {
  const date = getTaskCalendarDate(task);
  return date ? toCalendarDateKey(date) : null;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getPriorityWeight(priority: Task["priority"]): number {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}
