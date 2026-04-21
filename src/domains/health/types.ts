import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type HealthMood = "very_low" | "low" | "neutral" | "good" | "great";
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface HealthLog {
  id: EntityId;
  date: ISODateString;
  waterMl?: number;
  sleepHours?: number;
  weightKg?: number;
  steps?: number;
  mood?: HealthMood;
  energy?: EnergyLevel;
  notes?: string;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}
