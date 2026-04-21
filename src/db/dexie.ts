import Dexie, { Table } from "dexie";
import { Expense } from "@/domains/finance/types";
import { Goal } from "@/domains/goals/types";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HealthLog } from "@/domains/health/types";
import { AppSetting } from "@/domains/settings/types";
import { Task } from "@/domains/tasks/types";
import { registerDatabaseMigrations } from "@/db/migrations";
import { DB_NAME } from "@/db/schema";
import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export type DailyReviewMoodScore = 1 | 2 | 3 | 4 | 5;

export interface DailyReview {
  id: EntityId;
  date: ISODateString;
  summary?: string;
  wins?: string;
  challenges?: string;
  tomorrowFocus?: string;
  moodScore?: DailyReviewMoodScore;
  createdAt: TimestampMs;
  updatedAt: TimestampMs;
}

export class LifeOSDatabase extends Dexie {
  tasks!: Table<Task, EntityId>;
  habits!: Table<Habit, EntityId>;
  habitLogs!: Table<HabitLog, EntityId>;
  goals!: Table<Goal, EntityId>;
  expenses!: Table<Expense, EntityId>;
  healthLogs!: Table<HealthLog, EntityId>;
  dailyReviews!: Table<DailyReview, EntityId>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super(DB_NAME);
    registerDatabaseMigrations(this);
  }
}

export const db = new LifeOSDatabase();
