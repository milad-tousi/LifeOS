import { createId } from "@/lib/id";
import { Task } from "@/domains/tasks/types";

export function createTaskModel(title: string, scheduledAt?: number): Task {
  return {
    id: createId(),
    title,
    completed: false,
    createdAt: Date.now(),
    scheduledAt,
  };
}
