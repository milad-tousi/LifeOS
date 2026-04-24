import { Habit, HabitLog } from "@/domains/habits/types";

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateKey(): string {
  return formatDateKey(new Date());
}

export function calculateActiveHabits(habits: Habit[]): number {
  return habits.filter((habit) => !habit.archived).length;
}

export function calculateCompletedToday(habits: Habit[], logs: HabitLog[]): number {
  const today = getTodayDateKey();
  const activeHabitIds = new Set(habits.filter((habit) => !habit.archived).map((habit) => habit.id));

  return logs.filter(
    (log) => log.date === today && log.completed && activeHabitIds.has(log.habitId),
  ).length;
}

export function calculateSimpleStreak(habit: Habit, logs: HabitLog[]): number {
  if (habit.frequency !== "daily") {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const dateKey = formatDateKey(cursor);
    const completedLog = logs.find(
      (log) => log.habitId === habit.id && log.date === dateKey && log.completed,
    );

    if (!completedLog) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
