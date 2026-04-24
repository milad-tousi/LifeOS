import { Habit, HabitLog } from "@/domains/habits/types";
import {
  getDateKey,
  getScheduledDateKeysBetween,
  isFutureDate,
  parseDateKey,
} from "@/features/habits/utils/habit.utils";

export interface HabitGoalDateRange {
  startDate: Date;
  endDate: Date;
}

export interface GoalHabitProgress {
  linkedHabitCount: number;
  completionRate: number;
  completedScheduledDays: number;
  totalScheduledDays: number;
  linkedHabits: Habit[];
}

function getLogForDate(logs: HabitLog[], habitId: string, dateKey: string): HabitLog | undefined {
  return logs.find((log) => log.habitId === habitId && log.date === dateKey);
}

export function calculateGoalHabitProgress(
  goalId: string,
  habits: Habit[],
  logs: HabitLog[],
  dateRange: HabitGoalDateRange,
): GoalHabitProgress {
  const linkedHabits = habits.filter((habit) => !habit.archived && habit.goalId === goalId);
  const todayKey = getDateKey(new Date());
  let completedScheduledDays = 0;
  let totalScheduledDays = 0;

  linkedHabits.forEach((habit) => {
    const scheduledKeys = getScheduledDateKeysBetween(
      habit,
      dateRange.startDate < parseDateKey(habit.startDate) ? parseDateKey(habit.startDate) : dateRange.startDate,
      dateRange.endDate,
    );

    scheduledKeys.forEach((dateKey) => {
      if (isFutureDate(dateKey, todayKey)) {
        return;
      }

      totalScheduledDays += 1;
      const log = getLogForDate(logs, habit.id, dateKey);

      if (!log) {
        return;
      }

      if (log.completed) {
        completedScheduledDays += 1;
        return;
      }

      if (habit.type !== "binary" && habit.target > 0 && log.value > 0) {
        completedScheduledDays += Math.min(1, log.value / habit.target);
      }
    });
  });

  return {
    linkedHabitCount: linkedHabits.length,
    completionRate:
      totalScheduledDays === 0
        ? 0
        : Math.round((completedScheduledDays / totalScheduledDays) * 100),
    completedScheduledDays,
    totalScheduledDays,
    linkedHabits,
  };
}
