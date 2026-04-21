import { createId } from "@/lib/id";
import { Habit } from "@/domains/habits/types";

export function createHabitModel(name: string): Habit {
  return {
    id: createId(),
    name,
    frequency: "daily",
    createdAt: Date.now(),
  };
}
