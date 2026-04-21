import { createId } from "@/lib/id";
import { Habit } from "@/domains/habits/types";

export function createHabitModel(name: string): Habit {
  const timestamp = Date.now();

  return {
    id: createId(),
    name,
    frequency: "daily",
    targetPerPeriod: 1,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
