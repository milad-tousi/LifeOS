export type HabitType = "binary" | "count" | "duration";
export type HabitFrequency = "daily" | "weekly" | "custom";

export interface HabitReminder {
  enabled: boolean;
  time?: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  target: number;
  unit?: string;
  frequency: HabitFrequency;
  daysOfWeek?: number[];
  category?: string;
  startDate: string;
  endDate?: string;
  reminder?: HabitReminder;
  goalId?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
