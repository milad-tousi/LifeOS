import Dexie, { Table } from "dexie";
import { Expense } from "@/domains/finance/types";
import { Goal } from "@/domains/goals/types";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HealthLog } from "@/domains/health/types";
import { AppSetting } from "@/domains/settings/types";
import { Task } from "@/domains/tasks/types";

export interface DailyReview {
  id: string;
  date: number;
  text: string;
}

export class LifeOSDatabase extends Dexie {
  tasks!: Table<Task, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  goals!: Table<Goal, string>;
  expenses!: Table<Expense, string>;
  healthLogs!: Table<HealthLog, string>;
  dailyReviews!: Table<DailyReview, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super("lifeos");

    this.version(1).stores({
      tasks: "id, createdAt, scheduledAt, completed",
      habits: "id, frequency, createdAt",
      habitLogs: "id, habitId, date",
      goals: "id, status",
      expenses: "id, date, category",
      healthLogs: "id, date",
      dailyReviews: "id, date",
      settings: "id, key",
    });
  }
}

export const db = new LifeOSDatabase();
