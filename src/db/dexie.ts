import Dexie, { Table } from "dexie";
import { AuthUser } from "@/domains/auth/types";
import { CalendarEvent } from "@/domains/calendar/types";
import { Expense } from "@/domains/finance/types";
import { Goal } from "@/domains/goals/types";
import { Habit, HabitLog } from "@/domains/habits/types";
import { OnboardingState, UserPreferences, UserProfile } from "@/domains/onboarding/types";
import { AppSetting } from "@/domains/settings/types";
import { TaskBoardColumn } from "@/domains/tasks/board.types";
import { Task } from "@/domains/tasks/types";
import { registerDatabaseMigrations } from "@/db/migrations";
import { DB_NAME } from "@/db/schema";
import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";
import { createLogger } from "@/utils/logger";

const dbLogger = createLogger("db");

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
  authUsers!: Table<AuthUser, EntityId>;
  onboardingStates!: Table<OnboardingState, EntityId>;
  userPreferences!: Table<UserPreferences, EntityId>;
  userProfiles!: Table<UserProfile, EntityId>;
  tasks!: Table<Task, EntityId>;
  taskBoardColumns!: Table<TaskBoardColumn, EntityId>;
  calendarEvents!: Table<CalendarEvent, EntityId>;
  habits!: Table<Habit, EntityId>;
  habitLogs!: Table<HabitLog, EntityId>;
  goals!: Table<Goal, EntityId>;
  expenses!: Table<Expense, EntityId>;
  dailyReviews!: Table<DailyReview, EntityId>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super(DB_NAME);
    registerDatabaseMigrations(this);
    this.on("blocked", () => {
      dbLogger.warn("database upgrade blocked by another tab");
    });
    this.on("versionchange", () => {
      dbLogger.warn("database version change detected");
      this.close();
    });
  }
}

export const db = new LifeOSDatabase();

let dbReadyPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      dbLogger.info("database open requested", {
        hasIndexedDb: typeof indexedDB !== "undefined",
      });

      if (typeof indexedDB === "undefined") {
        throw new Error("IndexedDB is unavailable in this browser.");
      }

      await db.open();
      dbLogger.info("database open completed", {
        isOpen: db.isOpen(),
        name: db.name,
      });
    })().catch((error) => {
      dbReadyPromise = null;
      dbLogger.error("database open failed", error);
      throw error;
    });
  }

  return dbReadyPromise;
}

export async function checkDatabaseHealth(): Promise<{
  hasIndexedDb: boolean;
  isOpen: boolean;
  authUsersAccessible: boolean;
  onboardingAccessible: boolean;
}> {
  const hasIndexedDb = typeof indexedDB !== "undefined";

  try {
    await ensureDatabaseReady();
    await Promise.all([db.authUsers.limit(1).toArray(), db.onboardingStates.limit(1).toArray()]);

    const snapshot = {
      hasIndexedDb,
      isOpen: db.isOpen(),
      authUsersAccessible: true,
      onboardingAccessible: true,
    };
    dbLogger.info("database health check passed", snapshot);
    return snapshot;
  } catch (error) {
    dbLogger.error("database health check failed", error);
    return {
      hasIndexedDb,
      isOpen: db.isOpen(),
      authUsersAccessible: false,
      onboardingAccessible: false,
    };
  }
}
