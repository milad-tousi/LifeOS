import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export interface Goal {
  id: EntityId;
  title: string;
  description?: string;
  status: GoalStatus;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  deadline?: ISODateString;
  category?: string;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}
