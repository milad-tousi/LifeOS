import { createId } from "@/lib/id";
import { Habit, HabitLog } from "@/domains/habits/types";
import {
  calculateActiveHabits,
  calculateCompletedToday,
  calculateSimpleStreak,
  getTodayDateKey,
} from "@/features/habits/utils/habit.utils";

const HABITS_STORAGE_KEY = "lifeos:habits:v1";
const HABIT_LOGS_STORAGE_KEY = "lifeos:habitLogs:v1";

export type CreateHabitInput = Omit<
  Habit,
  "id" | "archived" | "createdAt" | "updatedAt" | "startDate"
> & {
  startDate?: string;
};

export interface TodayProgress {
  activeHabits: number;
  completedToday: number;
  completionPercent: number;
  currentBestStreak: number;
}

function readStorageArray<T>(key: string): T[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorageArray<T>(key: string, value: T[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function getHabits(): Habit[] {
  return readStorageArray<Habit>(HABITS_STORAGE_KEY);
}

export function saveHabits(habits: Habit[]): void {
  writeStorageArray(HABITS_STORAGE_KEY, habits);
}

export function createHabit(input: CreateHabitInput): Habit {
  const timestamp = new Date().toISOString();
  const habit: Habit = {
    ...input,
    id: createId(),
    target: input.type === "binary" ? 1 : Math.max(1, input.target),
    startDate: input.startDate ?? getTodayDateKey(),
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const habits = getHabits();

  saveHabits([habit, ...habits]);

  return habit;
}

export function updateHabit(id: string, patch: Partial<Habit>): Habit | null {
  const habits = getHabits();
  let updatedHabit: Habit | null = null;
  const nextHabits = habits.map((habit) => {
    if (habit.id !== id) {
      return habit;
    }

    updatedHabit = {
      ...habit,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    return updatedHabit;
  });

  saveHabits(nextHabits);

  return updatedHabit;
}

export function archiveHabit(id: string): Habit | null {
  return updateHabit(id, { archived: true });
}

export function deleteHabit(id: string): void {
  saveHabits(getHabits().filter((habit) => habit.id !== id));
  saveHabitLogs(getHabitLogs().filter((log) => log.habitId !== id));
}

export function getHabitLogs(): HabitLog[] {
  return readStorageArray<HabitLog>(HABIT_LOGS_STORAGE_KEY);
}

export function saveHabitLogs(logs: HabitLog[]): void {
  writeStorageArray(HABIT_LOGS_STORAGE_KEY, logs);
}

export function calculateHabitCompletion(habit: Habit, log?: HabitLog): boolean {
  if (!log) {
    return false;
  }

  return habit.type === "binary" ? log.value >= 1 : log.value >= habit.target;
}

export function upsertHabitLog(habitId: string, date: string, value: number): HabitLog {
  const timestamp = new Date().toISOString();
  const habits = getHabits();
  const habit = habits.find((item) => item.id === habitId);
  const logs = getHabitLogs();
  const existingLog = logs.find((log) => log.habitId === habitId && log.date === date);
  const safeValue = Math.max(0, value);
  const completionDraft = existingLog
    ? { ...existingLog, value: safeValue }
    : {
        id: "",
        habitId,
        date,
        value: safeValue,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
  const completed = habit ? calculateHabitCompletion(habit, completionDraft) : false;

  if (existingLog) {
    const updatedLog: HabitLog = {
      ...existingLog,
      value: safeValue,
      completed,
      updatedAt: timestamp,
    };

    saveHabitLogs(
      logs.map((log) => (log.id === existingLog.id ? updatedLog : log)),
    );

    return updatedLog;
  }

  const newLog: HabitLog = {
    id: createId(),
    habitId,
    date,
    value: safeValue,
    completed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveHabitLogs([newLog, ...logs]);

  return newLog;
}

export function getTodayHabitLog(habitId: string): HabitLog | undefined {
  const today = getTodayDateKey();

  return getHabitLogs().find((log) => log.habitId === habitId && log.date === today);
}

export function calculateTodayProgress(habits: Habit[], logs: HabitLog[]): TodayProgress {
  const activeHabits = calculateActiveHabits(habits);
  const completedToday = calculateCompletedToday(habits, logs);
  const currentBestStreak = habits
    .filter((habit) => !habit.archived)
    .reduce((bestStreak, habit) => Math.max(bestStreak, calculateSimpleStreak(habit, logs)), 0);

  return {
    activeHabits,
    completedToday,
    completionPercent: activeHabits === 0 ? 0 : Math.round((completedToday / activeHabits) * 100),
    currentBestStreak,
  };
}
