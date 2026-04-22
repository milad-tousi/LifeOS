import { createId } from "@/lib/id";
import {
  CreateTaskInput,
  Task,
  TaskSource,
  TaskSourceType,
  TaskStatus,
  TaskSubtask,
  TaskSubtaskProgress,
} from "@/domains/tasks/types";

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
