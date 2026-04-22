import { createId } from "@/lib/id";
import { CreateTaskInput, Task } from "@/domains/tasks/types";
import { getTaskSubtaskProgress, normalizeTaskInput } from "@/domains/tasks/task.utils";

export function createTaskModel(input: CreateTaskInput): Task {
  const timestamp = Date.now();
  const normalizedInput = normalizeTaskInput(input);
  const status = normalizedInput.status ?? "todo";
  const subtasks = normalizedInput.subtasks ?? [];

  return {
    id: createId(),
    title: normalizedInput.title,
    description: normalizedInput.description,
    notes: normalizedInput.description,
    status,
    priority: normalizedInput.priority ?? "medium",
    category: normalizedInput.category,
    goalId: normalizedInput.goalId,
    dueDate: normalizedInput.dueDate,
    scheduledDate: normalizedInput.dueDate,
    estimatedDurationMinutes: normalizedInput.estimatedDurationMinutes,
    sources: normalizedInput.sources ?? [],
    subtasks,
    subtaskProgress: getTaskSubtaskProgress(subtasks),
    scheduledAt: normalizedInput.scheduledAt,
    completedAt: status === "done" ? timestamp : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
