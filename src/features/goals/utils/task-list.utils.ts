import { Task, TaskPriority, TaskStatus } from "@/domains/tasks/types";

export type TaskStatusFilter = "all" | TaskStatus;
export type TaskPriorityFilter = "all" | TaskPriority;
export type TaskSourceFilter = "all" | "has_sources" | "no_sources";
export type TaskDueDateFilter = "all" | "due_soon" | "overdue" | "no_due_date";
export type TaskSortOption =
  | "newest"
  | "oldest"
  | "due_date_asc"
  | "due_date_desc"
  | "priority_desc"
  | "title_asc"
  | "status";

export interface TaskListFilters {
  status: TaskStatusFilter;
  priority: TaskPriorityFilter;
  tag: string;
  source: TaskSourceFilter;
  dueDate: TaskDueDateFilter;
}

export function filterTasks(
  tasks: Task[],
  query: string,
  filters: TaskListFilters,
  now = new Date(),
): Task[] {
  const normalizedQuery = query.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      task.title.toLowerCase().includes(normalizedQuery) ||
      (task.description ?? "").toLowerCase().includes(normalizedQuery) ||
      task.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    if (!matchesQuery) {
      return false;
    }

    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    if (filters.tag !== "all" && !task.tags.some((tag) => tag === filters.tag)) {
      return false;
    }

    if (filters.source === "has_sources" && task.sources.length === 0) {
      return false;
    }

    if (filters.source === "no_sources" && task.sources.length > 0) {
      return false;
    }

    if (!matchesDueDateFilter(task, filters.dueDate, now)) {
      return false;
    }

    return true;
  });
}

export function sortTasks(tasks: Task[], sortOption: TaskSortOption): Task[] {
  return [...tasks]
    .map((task, index) => ({ task, index }))
    .sort((left, right) => {
      const comparison = compareTasks(left.task, right.task, sortOption);
      return comparison === 0 ? left.index - right.index : comparison;
    })
    .map(({ task }) => task);
}

export function getVisibleTasks(
  tasks: Task[],
  query: string,
  filters: TaskListFilters,
  sortOption: TaskSortOption,
  now = new Date(),
): Task[] {
  return sortTasks(filterTasks(tasks, query, filters, now), sortOption);
}

export function hasActiveTaskListFilters(query: string, filters: TaskListFilters): boolean {
  return (
    query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.tag !== "all" ||
    filters.source !== "all" ||
    filters.dueDate !== "all"
  );
}

function compareTasks(left: Task, right: Task, sortOption: TaskSortOption): number {
  switch (sortOption) {
    case "oldest":
      return left.createdAt - right.createdAt;
    case "due_date_asc":
      return compareDueDates(left, right, "asc");
    case "due_date_desc":
      return compareDueDates(left, right, "desc");
    case "priority_desc":
      return getPriorityRank(right.priority) - getPriorityRank(left.priority);
    case "title_asc":
      return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
    case "status":
      return getStatusRank(left.status) - getStatusRank(right.status);
    case "newest":
    default:
      return right.createdAt - left.createdAt;
  }
}

function compareDueDates(left: Task, right: Task, direction: "asc" | "desc"): number {
  const leftDate = getDueDateTimestamp(left);
  const rightDate = getDueDateTimestamp(right);

  if (leftDate === null && rightDate === null) {
    return 0;
  }

  if (leftDate === null) {
    return 1;
  }

  if (rightDate === null) {
    return -1;
  }

  return direction === "asc" ? leftDate - rightDate : rightDate - leftDate;
}

function getPriorityRank(priority: TaskPriority): number {
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

function getStatusRank(status: TaskStatus): number {
  switch (status) {
    case "in_progress":
      return 1;
    case "todo":
      return 2;
    case "done":
      return 3;
    case "cancelled":
    default:
      return 4;
  }
}

function matchesDueDateFilter(task: Task, filter: TaskDueDateFilter, now: Date): boolean {
  if (filter === "all") {
    return true;
  }

  const dueTimestamp = getDueDateTimestamp(task);

  if (filter === "no_due_date") {
    return dueTimestamp === null;
  }

  if (dueTimestamp === null) {
    return false;
  }

  const dayDiff = Math.ceil((dueTimestamp - now.getTime()) / (1000 * 60 * 60 * 24));

  if (filter === "overdue") {
    return dueTimestamp < now.getTime() && task.status !== "done";
  }

  if (filter === "due_soon") {
    return dayDiff >= 0 && dayDiff <= 7;
  }

  return true;
}

function getDueDateTimestamp(task: Task): number | null {
  const rawDueDate = task.dueDate ?? task.scheduledDate;

  if (!rawDueDate) {
    return null;
  }

  const timestamp = new Date(rawDueDate).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}
