import { useCallback, useMemo, useState } from "react";
import { Habit, HabitLog } from "@/domains/habits/types";
import {
  archiveHabit,
  calculateTodayProgress,
  createHabit,
  CreateHabitInput,
  getHabitLogs,
  getHabits,
  TodayProgress,
  upsertHabitLog,
} from "@/features/habits/services/habits.storage";

export interface UseHabitsResult {
  habits: Habit[];
  logs: HabitLog[];
  loading: boolean;
  todayProgress: TodayProgress;
  addHabit: (input: CreateHabitInput) => Habit;
  archiveHabitById: (id: string) => void;
  updateTodayLog: (habitId: string, value: number) => void;
}

export function useHabits(): UseHabitsResult {
  const [habits, setHabits] = useState<Habit[]>(() => getHabits());
  const [logs, setLogs] = useState<HabitLog[]>(() => getHabitLogs());

  const refreshHabits = useCallback(() => {
    setHabits(getHabits());
    setLogs(getHabitLogs());
  }, []);

  const addHabit = useCallback((input: CreateHabitInput) => {
    const habit = createHabit(input);
    refreshHabits();

    return habit;
  }, [refreshHabits]);

  const archiveHabitById = useCallback((id: string) => {
    archiveHabit(id);
    refreshHabits();
  }, [refreshHabits]);

  const updateTodayLog = useCallback((habitId: string, value: number) => {
    upsertHabitLog(habitId, new Date().toISOString().slice(0, 10), value);
    refreshHabits();
  }, [refreshHabits]);

  const todayProgress = useMemo(
    () => calculateTodayProgress(habits, logs),
    [habits, logs],
  );

  return {
    habits,
    logs,
    loading: false,
    todayProgress,
    addHabit,
    archiveHabitById,
    updateTodayLog,
  };
}
