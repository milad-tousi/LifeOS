import { Task } from "@/domains/tasks/types";

export type TaskListGroupKey = "overdue" | "today" | "upcoming" | "no_date" | "completed";

export interface TaskListGroup {
  key: TaskListGroupKey;
  title: string;
  tasks: Task[];
}

export function groupTasksForListView(tasks: Task[], now = new Date()): TaskListGroup[] {
  const groups: Record<TaskListGroupKey, Task[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    no_date: [],
    completed: [],
  };

  tasks.forEach((task) => {
    if (task.status === "done") {
      groups.completed.push(task);
      return;
    }

    if (isTaskOverdue(task, now)) {
      groups.overdue.push(task);
      return;
    }

    if (isTaskDueToday(task, now)) {
      groups.today.push(task);
      return;
    }

    if (hasFutureDueDate(task, now)) {
      groups.upcoming.push(task);
      return;
    }

    groups.no_date.push(task);
  });

  return [
    createGroup("overdue", "Overdue", sortTasksByDueDate(groups.overdue, "asc")),
    createGroup("today", "Today", sortTasksByDueDate(groups.today, "asc")),
    createGroup("upcoming", "Upcoming", sortTasksByDueDate(groups.upcoming, "asc")),
    createGroup("no_date", "No date", sortTasksByCreatedAt(groups.no_date, "desc")),
    createGroup("completed", "Completed", sortTasksByCreatedAt(groups.completed, "desc")),
  ].filter((group) => group.tasks.length > 0);
}

export function isTaskDueToday(task: Task, now = new Date()): boolean {
  const dueDate = getTaskDueDate(task);

  if (!dueDate) {
    return false;
  }

  return (
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth() &&
    dueDate.getDate() === now.getDate()
  );
}

export function isTaskOverdue(task: Task, now = new Date()): boolean {
  if (task.status === "done") {
    return false;
  }

  const dueDate = getTaskDueDate(task);

  if (!dueDate) {
    return false;
  }

  return dueDate.getTime() < getStartOfDay(now).getTime();
}

export function formatTaskDueDate(task: Task): string | null {
  const dueDate = getTaskDueDate(task);

  if (!dueDate) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dueDate);
}

function hasFutureDueDate(task: Task, now: Date): boolean {
  const dueDate = getTaskDueDate(task);

  if (!dueDate) {
    return false;
  }

  return dueDate.getTime() > getEndOfDay(now).getTime();
}

function getTaskDueDate(task: Task): Date | null {
  const rawDueDate = task.dueDate ?? task.scheduledDate;

  if (!rawDueDate) {
    return null;
  }

  const safeDate = new Date(`${rawDueDate}T12:00:00`);
  return Number.isNaN(safeDate.getTime()) ? null : safeDate;
}

function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function sortTasksByDueDate(tasks: Task[], direction: "asc" | "desc"): Task[] {
  return [...tasks].sort((left, right) => {
    const leftTime = getTaskDueDate(left)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightTime = getTaskDueDate(right)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    if (leftTime !== rightTime) {
      return direction === "asc" ? leftTime - rightTime : rightTime - leftTime;
    }

    return right.createdAt - left.createdAt;
  });
}

function sortTasksByCreatedAt(tasks: Task[], direction: "asc" | "desc"): Task[] {
  return [...tasks].sort((left, right) =>
    direction === "asc" ? left.createdAt - right.createdAt : right.createdAt - left.createdAt,
  );
}

function createGroup(key: TaskListGroupKey, title: string, tasks: Task[]): TaskListGroup {
  return {
    key,
    title,
    tasks,
  };
}
