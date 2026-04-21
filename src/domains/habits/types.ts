export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: number;
  value?: number;
}
