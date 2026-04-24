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

export function getHabitPeriodStartDate(habit: Habit, date: Date): Date | null {
  if (habit.archived) {
    return null;
  }

  const dateKey = getDateKey(date);

  if (dateKey < habit.startDate || (habit.endDate && dateKey > habit.endDate)) {
    return null;
  }

  if (habit.frequency === "weekly") {
    const anchorDate = parseDateKey(habit.startDate);
    const anchorWeekday = anchorDate.getDay();
    const periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysSinceAnchor = (periodStart.getDay() - anchorWeekday + 7) % 7;
    periodStart.setDate(periodStart.getDate() - daysSinceAnchor);

    return periodStart < anchorDate ? anchorDate : periodStart;
  }

  if (!isHabitActiveOnDate(habit, date)) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getHabitPeriodEndDate(habit: Habit, date: Date): Date | null {
  const periodStart = getHabitPeriodStartDate(habit, date);

  if (!periodStart) {
    return null;
  }

  if (habit.frequency === "weekly") {
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);

    if (habit.endDate && getDateKey(periodEnd) > habit.endDate) {
      return parseDateKey(habit.endDate);
    }

    return periodEnd;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getHabitCurrentPeriodKey(habit: Habit, date: Date): string | null {
  const periodStart = getHabitPeriodStartDate(habit, date);

  if (!periodStart) {
    return null;
  }

  const periodStartKey = getDateKey(periodStart);

  return habit.frequency === "weekly" ? `week-${periodStartKey}` : periodStartKey;
}

export function getHabitCurrentLogKey(habit: Habit, date: Date): string | null {
  return getHabitCurrentPeriodKey(habit, date);
}

export function getHabitLogPeriodKey(log: HabitLog): string {
  return log.periodKey ?? log.date;
}

export function isHabitLogCompletedForPeriod(
  habit: Habit,
  logs: HabitLog[],
  periodKey: string,
): boolean {
  return logs.some(
    (log) =>
      log.habitId === habit.id && getHabitLogPeriodKey(log) === periodKey && isHabitLogCompleted(habit, log),
  );
}

export function calculateActiveHabits(habits: Habit[], date = new Date()): number {
  return habits.filter((habit) => isHabitActiveOnDate(habit, date)).length;
}

export function calculateCompletedToday(habits: Habit[], logs: HabitLog[], date = new Date()): number {
  return habits.filter((habit) => {
    if (!isHabitActiveOnDate(habit, date)) {
      return false;
    }

    const periodKey = getHabitCurrentPeriodKey(habit, date);

    return periodKey ? isHabitLogCompletedForPeriod(habit, logs, periodKey) : false;
  }).length;
}

export function isHabitLogCompleted(habit: Habit, log?: HabitLog): boolean {
  if (!log) {
    return false;
  }

  if (habit.type === "binary") {
    return log.completed || log.value >= 1;
  }

  return log.completed || log.value >= habit.target;
}

export function isHabitLogPartial(habit: Habit, log?: HabitLog): boolean {
  if (!log || habit.type === "binary") {
    return false;
  }

  return log.value > 0 && !isHabitLogCompleted(habit, log);
}

function getCompletedLogForPeriod(
  habit: Habit,
  logs: HabitLog[],
  periodKey: string,
): HabitLog | undefined {
  return logs.find(
    (log) =>
      log.habitId === habit.id && getHabitLogPeriodKey(log) === periodKey && isHabitLogCompleted(habit, log),
  );
}

function getScheduledPeriodsBetween(
  habit: Habit,
  startDate: Date,
  endDate: Date,
): Array<{ endKey: string; periodKey: string }> {
  const periods: Array<{ endKey: string; periodKey: string }> = [];
  const seenPeriods = new Set<string>();
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (cursor <= end) {
    if (isHabitActiveOnDate(habit, cursor)) {
      const periodKey = getHabitCurrentPeriodKey(habit, cursor);
      const periodEnd = getHabitPeriodEndDate(habit, cursor);

      if (periodKey && periodEnd && !seenPeriods.has(periodKey)) {
        periods.push({ endKey: getDateKey(periodEnd), periodKey });
        seenPeriods.add(periodKey);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return periods;
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
      const periodKey = getHabitCurrentPeriodKey(habit, cursor);

      if (periodKey && !keys.includes(periodKey)) {
        keys.push(periodKey);
      }
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
  const scheduledPeriods = getScheduledPeriodsBetween(
    habit,
    parseDateKey(habit.startDate),
    todayDate,
  );
  let streak = 0;

  for (let index = scheduledPeriods.length - 1; index >= 0; index -= 1) {
    const period = scheduledPeriods[index];

    if (getCompletedLogForPeriod(habit, logs, period.periodKey)) {
      streak += 1;
      continue;
    }

    if (!isPastDate(period.endKey, todayKey)) {
      continue;
    }

    break;
  }

  return streak;
}

export function calculateLongestStreak(habit: Habit, logs: HabitLog[]): number {
  const today = new Date();
  const todayKey = getDateKey(today);
  const scheduledPeriods = getScheduledPeriodsBetween(habit, parseDateKey(habit.startDate), today);
  let longestStreak = 0;
  let currentStreak = 0;

  scheduledPeriods.forEach((period) => {
    if (getCompletedLogForPeriod(habit, logs, period.periodKey)) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      return;
    }

    if (!isPastDate(period.endKey, todayKey)) {
      return;
    }

    currentStreak = 0;
  });

  return longestStreak;
}

export function calculateSimpleStreak(habit: Habit, logs: HabitLog[]): number {
  return calculateCurrentStreak(habit, logs);
}
