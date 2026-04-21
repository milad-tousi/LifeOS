import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type TaskStatus = "pending" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: EntityId;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  goalId?: EntityId;
  scheduledDate?: ISODateString;
  scheduledAt?: TimestampMs;
  completedAt?: TimestampMs;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  priority?: TaskPriority;
  category?: string;
  goalId?: EntityId;
  scheduledDate?: ISODateString;
  scheduledAt?: TimestampMs;
}
