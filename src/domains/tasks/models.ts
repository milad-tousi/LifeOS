import { createId } from "@/lib/id";
import { CreateTaskInput, Task } from "@/domains/tasks/types";

export function createTaskModel(input: CreateTaskInput): Task {
  const timestamp = Date.now();

  return {
    id: createId(),
    title: input.title,
    notes: input.notes,
    status: "pending",
    priority: input.priority ?? "medium",
    category: input.category,
    scheduledDate: input.scheduledDate,
    scheduledAt: input.scheduledAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
