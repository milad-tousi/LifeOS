import { createId } from "@/lib/id";
import { Habit, HabitLog } from "@/domains/habits/types";
import {
  calculateActiveHabits,
  calculateCompletedToday,
  calculateCurrentStreak,
  getHabitCurrentPeriodKey,
  getHabitLogPeriodKey,
  getHabitPeriodEndDate,
  getHabitPeriodStartDate,
  getDateKey,
  getTodayDateKey,
  isHabitActiveOnDate,
  parseDateKey,
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

export function getHabitLogForDate(habitId: string, dateKey: string): HabitLog | undefined {
  return getHabitLogs().find((log) => log.habitId === habitId && log.date === dateKey);
}

export function getCurrentHabitLog(habit: Habit, currentDate = new Date()): HabitLog | undefined {
  const periodKey = getHabitCurrentPeriodKey(habit, currentDate);

  if (!periodKey) {
    return undefined;
  }

  return getHabitLogs().find(
    (log) => log.habitId === habit.id && getHabitLogPeriodKey(log) === periodKey,
  );
}

export function getHabitLogsByHabitId(habitId: string): HabitLog[] {
  return getHabitLogs().filter((log) => log.habitId === habitId);
}

export function getHabitValueForDate(habitId: string, dateKey: string): number {
  return getHabitLogForDate(habitId, dateKey)?.value ?? 0;
}

export function calculateHabitCompletion(habit: Habit, log?: HabitLog): boolean {
  if (!log) {
    return false;
  }

  return habit.type === "binary" ? log.value >= 1 : log.value >= habit.target;
}

export function upsertHabitLog(
  habitId: string,
  date: string,
  value: number,
  note?: string,
): HabitLog {
  const timestamp = new Date().toISOString();
  const habits = getHabits();
  const habit = habits.find((item) => item.id === habitId);
  const logs = getHabitLogs();
  const actionDate = parseDateKey(date);
  const periodKey = habit ? getHabitCurrentPeriodKey(habit, actionDate) ?? date : date;
  const periodStart = habit ? getHabitPeriodStartDate(habit, actionDate) : null;
  const periodEnd = habit ? getHabitPeriodEndDate(habit, actionDate) : null;
  const existingLog = logs.find(
    (log) => log.habitId === habitId && getHabitLogPeriodKey(log) === periodKey,
  );
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
      date,
      periodKey,
      periodStart: periodStart ? getDateKey(periodStart) : date,
      periodEnd: periodEnd ? getDateKey(periodEnd) : date,
      value: safeValue,
      completed,
      note: note ?? existingLog.note,
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
    periodKey,
    periodStart: periodStart ? getDateKey(periodStart) : date,
    periodEnd: periodEnd ? getDateKey(periodEnd) : date,
    value: safeValue,
    completed,
    note,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveHabitLogs([newLog, ...logs]);

  return newLog;
}

export function deleteHabitLog(habitId: string, dateKey: string): void {
  const habit = getHabits().find((item) => item.id === habitId);
  const periodKey = habit
    ? getHabitCurrentPeriodKey(habit, parseDateKey(dateKey)) ?? dateKey
    : dateKey;

  saveHabitLogs(
    getHabitLogs().filter(
      (log) => !(log.habitId === habitId && getHabitLogPeriodKey(log) === periodKey),
    ),
  );
}

export function getTodayHabitLog(habitId: string): HabitLog | undefined {
  const habit = getHabits().find((item) => item.id === habitId);

  return habit ? getCurrentHabitLog(habit) : getHabitLogForDate(habitId, getTodayDateKey());
}

export function calculateTodayProgress(
  habits: Habit[],
  logs: HabitLog[],
  today = new Date(),
): TodayProgress {
  const activeHabits = calculateActiveHabits(habits, today);
  const completedToday = calculateCompletedToday(habits, logs, today);
  const currentBestStreak = habits
    .filter((habit) => isHabitActiveOnDate(habit, today))
    .reduce((bestStreak, habit) => Math.max(bestStreak, calculateCurrentStreak(habit, logs, today)), 0);

  return {
    activeHabits,
    completedToday,
    completionPercent: activeHabits === 0 ? 0 : Math.round((completedToday / activeHabits) * 100),
    currentBestStreak,
  };
}

export { getDateKey };
