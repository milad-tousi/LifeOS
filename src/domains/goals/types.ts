import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type GoalStatus = "active" | "paused" | "completed" | "archived";
export type GoalCategory = "health" | "finance" | "career" | "learning" | "lifestyle";
export type GoalPriority = "low" | "medium" | "high";
export type GoalPace = "gentle" | "balanced" | "ambitious";

export interface Goal {
  id: EntityId;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: GoalPriority;
  pace: GoalPace;
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
  deadline?: ISODateString;
}
