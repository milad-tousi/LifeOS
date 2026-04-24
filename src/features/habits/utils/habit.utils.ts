import { Habit, HabitLog } from "@/domains/habits/types";

export interface CalendarDay {
  date: Date | null;
  dateKey: string | null;
  isCurrentMonth: boolean;
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateKey(date: Date): string {
  return getDateKey(date);
}

export function getTodayDateKey(): string {
  return getDateKey(new Date());
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDateKey(a: string, b: string): boolean {
  return a === b;
}

export function isFutureDate(dateKey: string, todayKey: string): boolean {
  return dateKey > todayKey;
}

export function isPastDate(dateKey: string, todayKey: string): boolean {
  return dateKey < todayKey;
}

export function getCalendarDaysForMonth(date: Date): CalendarDay[] {
  const firstDay = startOfMonth(date);
  const lastDay = endOfMonth(date);
  const days: CalendarDay[] = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    days.push({ date: null, dateKey: null, isCurrentMonth: false });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const calendarDate = new Date(date.getFullYear(), date.getMonth(), day);
    days.push({
      date: calendarDate,
      dateKey: getDateKey(calendarDate),
      isCurrentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ date: null, dateKey: null, isCurrentMonth: false });
  }

  return days;
}

export function isHabitActiveOnDate(habit: Habit, date: Date): boolean {
  if (habit.archived) {
    return false;
  }

  const dateKey = getDateKey(date);

  if (dateKey < habit.startDate) {
    return false;
  }

  if (habit.endDate && dateKey > habit.endDate) {
    return false;
  }

  if (habit.frequency === "daily") {
    return true;
  }

  if (habit.frequency === "weekly") {
    return date.getDay() === parseDateKey(habit.startDate).getDay();
  }

  return habit.daysOfWeek?.includes(date.getDay()) ?? false;
}

export function calculateActiveHabits(habits: Habit[], date = new Date()): number {
  return habits.filter((habit) => isHabitActiveOnDate(habit, date)).length;
}

export function calculateCompletedToday(habits: Habit[], logs: HabitLog[], date = new Date()): number {
  const today = getDateKey(date);
  const activeHabitIds = new Set(
    habits.filter((habit) => isHabitActiveOnDate(habit, date)).map((habit) => habit.id),
  );

  return logs.filter(
    (log) => log.date === today && log.completed && activeHabitIds.has(log.habitId),
  ).length;
}

function hasCompletedLog(habitId: string, logs: HabitLog[], dateKey: string): boolean {
  return logs.some((log) => log.habitId === habitId && log.date === dateKey && log.completed);
}

export function getScheduledDateKeysBetween(
  habit: Habit,
  startDate: Date,
  endDate: Date,
): string[] {
  const keys: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (cursor <= end) {
    if (isHabitActiveOnDate(habit, cursor)) {
      keys.push(getDateKey(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

export function calculateCurrentStreak(
  habit: Habit,
  logs: HabitLog[],
  todayDate = new Date(),
): number {
  const todayKey = getDateKey(todayDate);
  const scheduledKeys = getScheduledDateKeysBetween(
    habit,
    parseDateKey(habit.startDate),
    todayDate,
  ).filter((dateKey) => dateKey <= todayKey);
  let streak = 0;

  for (let index = scheduledKeys.length - 1; index >= 0; index -= 1) {
    if (!hasCompletedLog(habit.id, logs, scheduledKeys[index])) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function calculateLongestStreak(habit: Habit, logs: HabitLog[]): number {
  const today = new Date();
  const scheduledKeys = getScheduledDateKeysBetween(habit, parseDateKey(habit.startDate), today);
  let longestStreak = 0;
  let currentStreak = 0;

  scheduledKeys.forEach((dateKey) => {
    if (hasCompletedLog(habit.id, logs, dateKey)) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      return;
    }

    currentStreak = 0;
  });

  return longestStreak;
}

export function calculateSimpleStreak(habit: Habit, logs: HabitLog[]): number {
  return calculateCurrentStreak(habit, logs);
}
