import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  id: EntityId;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  targetPerPeriod: number;
  category?: string;
  color?: string;
  isArchived: boolean;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export interface HabitLog {
  id: EntityId;
  habitId: EntityId;
  date: ISODateString;
  value: number;
  createdAt: TimestampMs;
}
