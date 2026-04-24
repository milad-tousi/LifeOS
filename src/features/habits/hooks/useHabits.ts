import { useCallback, useMemo, useState } from "react";
import { Habit, HabitLog } from "@/domains/habits/types";
import {
  createHabitCategory,
  CreateHabitCategoryInput,
  deleteHabitCategory,
  getHabitCategories,
  HabitCategory,
  updateHabitCategory,
} from "@/features/habits/services/habit-categories.storage";
import {
  getHabitReminderSettings,
  HabitReminderSettings,
  updateHabitReminderSettings,
} from "@/features/habits/services/habit-reminder-settings.storage";
import { rebuildHabitReminderScheduler } from "@/services/habitReminderScheduler";
import {
  archiveHabit,
  calculateTodayProgress,
  createHabit,
  CreateHabitInput,
  deleteHabitLog,
  getHabitLogs,
  getHabits,
  TodayProgress,
  updateHabit,
  upsertHabitLog,
} from "@/features/habits/services/habits.storage";

export interface UseHabitsResult {
  habits: Habit[];
  categories: HabitCategory[];
  logs: HabitLog[];
  loading: boolean;
  reminderSettings: HabitReminderSettings;
  todayProgress: TodayProgress;
  addHabit: (input: CreateHabitInput) => Habit;
  addCategory: (input: CreateHabitCategoryInput) => HabitCategory;
  archiveHabitById: (id: string) => void;
  deleteCategoryById: (id: string) => void;
  editHabitById: (id: string, patch: Partial<Habit>) => Habit | null;
  updateCategoryById: (
    id: string,
    patch: Partial<Pick<HabitCategory, "name" | "color">>,
  ) => HabitCategory | null;
  updateReminderSettings: (patch: Partial<HabitReminderSettings>) => HabitReminderSettings;
  updateHabitLogForDate: (habitId: string, dateKey: string, value: number, note?: string) => void;
  deleteHabitLogForDate: (habitId: string, dateKey: string) => void;
  updateTodayLog: (habitId: string, value: number) => void;
}

export function useHabits(): UseHabitsResult {
  const [habits, setHabits] = useState<Habit[]>(() => getHabits());
  const [categories, setCategories] = useState<HabitCategory[]>(() => getHabitCategories());
  const [logs, setLogs] = useState<HabitLog[]>(() => getHabitLogs());
  const [reminderSettings, setReminderSettings] = useState<HabitReminderSettings>(() =>
    getHabitReminderSettings(),
  );

  const refreshHabits = useCallback(() => {
    setHabits(getHabits());
    setCategories(getHabitCategories());
    setLogs(getHabitLogs());
    setReminderSettings(getHabitReminderSettings());
  }, []);

  const addHabit = useCallback((input: CreateHabitInput) => {
    const habit = createHabit(input);
    refreshHabits();
    rebuildHabitReminderScheduler();

    return habit;
  }, [refreshHabits]);

  const addCategory = useCallback((input: CreateHabitCategoryInput) => {
    const category = createHabitCategory(input);
    refreshHabits();

    return category;
  }, [refreshHabits]);

  const archiveHabitById = useCallback((id: string) => {
    archiveHabit(id);
    refreshHabits();
    rebuildHabitReminderScheduler();
  }, [refreshHabits]);

  const deleteCategoryById = useCallback((id: string) => {
    deleteHabitCategory(id);
    refreshHabits();
  }, [refreshHabits]);

  const editHabitById = useCallback((id: string, patch: Partial<Habit>) => {
    const habit = updateHabit(id, patch);
    refreshHabits();
    rebuildHabitReminderScheduler();

    return habit;
  }, [refreshHabits]);

  const updateCategoryById = useCallback((
    id: string,
    patch: Partial<Pick<HabitCategory, "name" | "color">>,
  ) => {
    const category = updateHabitCategory(id, patch);
    refreshHabits();

    return category;
  }, [refreshHabits]);

  const updateReminderSettings = useCallback((patch: Partial<HabitReminderSettings>) => {
    const settings = updateHabitReminderSettings(patch);
    setReminderSettings(settings);
    rebuildHabitReminderScheduler();

    return settings;
  }, []);

  const updateHabitLogForDate = useCallback((
    habitId: string,
    dateKey: string,
    value: number,
    note?: string,
  ) => {
    upsertHabitLog(habitId, dateKey, value, note);
    refreshHabits();
    rebuildHabitReminderScheduler();
  }, [refreshHabits]);

  const deleteHabitLogForDate = useCallback((habitId: string, dateKey: string) => {
    deleteHabitLog(habitId, dateKey);
    refreshHabits();
    rebuildHabitReminderScheduler();
  }, [refreshHabits]);

  const updateTodayLog = useCallback((habitId: string, value: number) => {
    upsertHabitLog(habitId, new Date().toISOString().slice(0, 10), value);
    refreshHabits();
    rebuildHabitReminderScheduler();
  }, [refreshHabits]);

  const todayProgress = useMemo(
    () => calculateTodayProgress(habits, logs),
    [habits, logs],
  );

  return {
    habits,
    categories,
    logs,
    loading: false,
    reminderSettings,
    todayProgress,
    addHabit,
    addCategory,
    archiveHabitById,
    deleteCategoryById,
    editHabitById,
    updateCategoryById,
    updateReminderSettings,
    updateHabitLogForDate,
    deleteHabitLogForDate,
    updateTodayLog,
  };
}
