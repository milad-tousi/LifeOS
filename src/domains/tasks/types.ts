import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSourceType = "image" | "video" | "link" | "file" | "note";

export interface TaskSource {
  id: EntityId;
  type: TaskSourceType;
  label: string;
  value: string;
  note?: string;
  fileName?: string;
  mimeType?: string;
  previewUrl?: string;
  origin?: "url" | "local";
}

export interface TaskSubtask {
  id: EntityId;
  title: string;
  description?: string;
  completed: boolean;
}

export interface TaskSubtaskProgress {
  completed: number;
  total: number;
}

export interface Task {
  id: EntityId;
  title: string;
  description?: string;
  notes?: string;
  tags: string[];
  sortOrder: number;
  boardColumnId?: EntityId | null;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  goalId?: EntityId;
  parentTaskId?: EntityId;
  dueDate?: ISODateString;
  scheduledDate?: ISODateString;
  estimatedDurationMinutes?: number;
  sources: TaskSource[];
  subtasks: TaskSubtask[];
  subtaskProgress: TaskSubtaskProgress;
  scheduledAt?: TimestampMs;
  completedAt?: TimestampMs;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  notes?: string;
  tags?: string[];
  sortOrder?: number;
  boardColumnId?: EntityId | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  goalId?: EntityId;
  parentTaskId?: EntityId;
  dueDate?: ISODateString;
  scheduledDate?: ISODateString;
  estimatedDurationMinutes?: number;
  sources?: TaskSource[];
  subtasks?: TaskSubtask[];
  subtaskProgress?: TaskSubtaskProgress;
  scheduledAt?: TimestampMs;
}
