import { createId } from "@/lib/id";
import { getDefaultBoardColumnIdForStatus } from "@/domains/tasks/board.utils";
import {
  CreateTaskInput,
  Task,
  TaskSource,
  TaskSourceType,
  TaskStatus,
  TaskSubtask,
  TaskSubtaskProgress,
} from "@/domains/tasks/types";

export interface TaskSourceSummaryItem {
  type: TaskSourceType;
  count: number;
  label: string;
}

export function normalizeTaskStatus(status?: string): TaskStatus {
  switch (status) {
    case "done":
    case "in_progress":
    case "todo":
    case "cancelled":
      return status;
    case "completed":
      return "done";
    case "pending":
    default:
      return "todo";
  }
}

export function getTaskSubtaskProgress(subtasks: TaskSubtask[]): TaskSubtaskProgress {
  const completed = subtasks.filter((subtask) => subtask.completed).length;

  return {
    completed,
    total: subtasks.length,
  };
}

export function normalizeTaskTags(tags?: string[]): string[] {
  if (!tags?.length) {
    return [];
  }

  const seen = new Set<string>();

  return tags.reduce<string[]>((normalized, tag) => {
    const nextTag = tag.trim();

    if (!nextTag) {
      return normalized;
    }

    const tagKey = nextTag.toLowerCase();

    if (seen.has(tagKey)) {
      return normalized;
    }

    seen.add(tagKey);
    normalized.push(nextTag);
    return normalized;
  }, []);
}

function normalizeTaskSourceType(type?: string): TaskSourceType {
  switch (type) {
    case "image":
    case "video":
    case "link":
    case "file":
    case "note":
      return type;
    default:
      return "link";
  }
}

export function normalizeTaskSource(source: Partial<TaskSource>): TaskSource {
  return {
    id: source.id ?? createId(),
    type: normalizeTaskSourceType(source.type),
    label: source.label?.trim() ?? "",
    value: source.value?.trim() ?? "",
    query: source.query?.trim() || undefined,
    generatedFromAiSearch: Boolean(source.generatedFromAiSearch),
    note: source.note?.trim() || undefined,
    fileName: source.fileName?.trim() || undefined,
    mimeType: source.mimeType?.trim() || undefined,
    previewUrl: source.previewUrl?.trim() || undefined,
    origin: source.origin === "local" ? "local" : "url",
  };
}

export function normalizeTaskSubtask(subtask: Partial<TaskSubtask>): TaskSubtask {
  return {
    id: subtask.id ?? createId(),
    title: subtask.title?.trim() ?? "",
    description: subtask.description?.trim() || undefined,
    completed: Boolean(subtask.completed),
  };
}

export function normalizeTaskInput(input: CreateTaskInput): CreateTaskInput {
  const description = input.description?.trim() || input.notes?.trim() || undefined;
  const dueDate = input.dueDate ?? input.scheduledDate;
  const status = normalizeTaskStatus(input.status);
  const subtasks = (input.subtasks ?? []).map(normalizeTaskSubtask);

  return {
    ...input,
    title: input.title.trim(),
    description,
    notes: description,
    tags: normalizeTaskTags(input.tags),
    sortOrder: input.sortOrder,
    boardColumnId: input.boardColumnId ?? undefined,
    status,
    dueDate,
    scheduledDate: dueDate,
    estimatedDurationMinutes: input.estimatedDurationMinutes,
    sources: (input.sources ?? []).map(normalizeTaskSource),
    subtasks,
    subtaskProgress: getTaskSubtaskProgress(subtasks),
  };
}

export function normalizeTask(task: Task): Task {
  const description = task.description?.trim() || task.notes?.trim() || undefined;
  const dueDate = task.dueDate ?? task.scheduledDate;
  const subtasks = (task.subtasks ?? []).map(normalizeTaskSubtask);
  const normalizedStatus = normalizeTaskStatus(task.status);

  return {
    ...task,
    title: task.title.trim(),
    description,
    notes: description,
    tags: normalizeTaskTags(task.tags),
    sortOrder: Number.isFinite(task.sortOrder) ? task.sortOrder : task.createdAt,
    boardColumnId:
      task.boardColumnId ?? getDefaultBoardColumnIdForStatus(normalizedStatus),
    dueDate,
    scheduledDate: dueDate,
    status: normalizedStatus,
    sources: (task.sources ?? []).map(normalizeTaskSource),
    subtasks,
    subtaskProgress: getTaskSubtaskProgress(subtasks),
    completedAt:
      normalizedStatus === "done" ? task.completedAt ?? task.updatedAt : undefined,
  };
}

export function sortTasksByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    if (left.createdAt !== right.createdAt) {
      return left.createdAt - right.createdAt;
    }

    return left.id.localeCompare(right.id);
  });
}

export function summarizeTaskSources(sources: TaskSource[]): TaskSourceSummaryItem[] {
  if (!sources.length) {
    return [];
  }

  const labels: Record<TaskSourceType, string> = {
    image: "image",
    video: "video",
    link: "link",
    file: "file",
    note: "note",
  };
  const order: TaskSourceType[] = ["link", "image", "video", "file", "note"];
  const counts = sources.reduce<Record<TaskSourceType, number>>(
    (summary, source) => ({
      ...summary,
      [source.type]: summary[source.type] + 1,
    }),
    {
      image: 0,
      video: 0,
      link: 0,
      file: 0,
      note: 0,
    },
  );

  return order
    .filter((type) => counts[type] > 0)
    .map((type) => ({
      type,
      count: counts[type],
      label: `${counts[type]} ${labels[type]}${counts[type] === 1 ? "" : "s"}`,
    }));
}
