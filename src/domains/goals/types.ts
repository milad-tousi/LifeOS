import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type GoalStatus = "active" | "paused" | "completed" | "archived";
export type GoalCategory = "health" | "finance" | "career" | "learning" | "lifestyle";
export type GoalPriority = "low" | "medium" | "high";
export type GoalPace = "gentle" | "balanced" | "ambitious";
export type GoalTargetType = "none" | "count" | "binary" | "milestone" | "percentage";
export type GoalProgressType = "tasks" | "subtasks" | "manual" | "target";

export interface Goal {
  id: EntityId;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: GoalPriority;
  pace: GoalPace;
  targetType: GoalTargetType;
  targetValue?: number | null;
  currentValue?: number | null;
  progressType: GoalProgressType;
  manualProgress?: number | null;
  notes?: string;
  deadline?: ISODateString;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  pace: GoalPace;
  targetType?: GoalTargetType;
  targetValue?: number | null;
  currentValue?: number | null;
  progressType?: GoalProgressType;
  manualProgress?: number | null;
  notes?: string;
  deadline?: ISODateString;
}
