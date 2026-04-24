import { createId } from "@/lib/id";
import { Habit, HabitFrequency, HabitType } from "@/domains/habits/types";

interface CreateHabitModelInput {
  title: string;
  description?: string;
  type?: HabitType;
  target?: number;
  unit?: string;
  frequency?: HabitFrequency;
  daysOfWeek?: number[];
  category?: string;
  reminder?: Habit["reminder"];
}

export function createHabitModel(input: CreateHabitModelInput | string): Habit {
  const timestamp = new Date().toISOString();
  const habitInput = typeof input === "string" ? { title: input } : input;
  const type = habitInput.type ?? "binary";

  return {
    id: createId(),
    title: habitInput.title,
    description: habitInput.description,
    type,
    target: type === "binary" ? 1 : Math.max(1, habitInput.target ?? 1),
    unit: habitInput.unit,
    frequency: habitInput.frequency ?? "daily",
    daysOfWeek: habitInput.daysOfWeek,
    category: habitInput.category,
    startDate: timestamp.slice(0, 10),
    reminder: habitInput.reminder,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
