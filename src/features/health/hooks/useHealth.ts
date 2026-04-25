import { useMemo, useState } from "react";
import {
  calculateBodyMetricOverviewStats,
  calculateHealthOverviewStats,
  calculateNutritionOverviewStats,
  calculateRecoveryOverviewStats,
  calculateWorkoutOverviewStats,
} from "@/features/health/services/healthCalculations";
import { healthStorage } from "@/features/health/services/healthStorage";
import {
  BodyMetricLog,
  BodyMetricLogInput,
  BodyMetricOverviewStats,
  HealthLog,
  HealthLogInput,
  HealthOverviewStats,
  MealTemplate,
  MealTemplateInput,
  NutritionMeal,
  NutritionMealInput,
  NutritionOverviewStats,
  RecoveryCheckIn,
  RecoveryCheckInInput,
  RecoveryOverviewStats,
  WorkoutLog,
  WorkoutLogInput,
  WorkoutOverviewStats,
} from "@/features/health/types/health.types";

export interface UseHealthResult {
  bodyMetricLogs: BodyMetricLog[];
  bodyMetricOverviewStats: BodyMetricOverviewStats;
  deleteBodyMetricLog: (id: string) => void;
  deleteLog: (id: string) => void;
  deleteMealTemplate: (id: string) => void;
  deleteNutritionMeal: (id: string) => void;
  deleteRecoveryCheckIn: (id: string) => void;
  deleteWorkoutLog: (id: string) => void;
  logs: HealthLog[];
  mealTemplates: MealTemplate[];
  nutritionMeals: NutritionMeal[];
  nutritionOverviewStats: NutritionOverviewStats;
  overviewStats: HealthOverviewStats;
  recoveryCheckIns: RecoveryCheckIn[];
  recoveryOverviewStats: RecoveryOverviewStats;
  saveMealTemplate: (input: MealTemplateInput) => void;
  saveNutritionMeal: (input: NutritionMealInput) => void;
  saveTodayRecoveryCheckIn: (input: RecoveryCheckInInput) => void;
  saveTodayBodyMetricLog: (input: BodyMetricLogInput) => void;
  saveTodayLog: (input: HealthLogInput) => void;
  saveWorkoutLog: (input: WorkoutLogInput) => void;
  workoutLogs: WorkoutLog[];
  workoutOverviewStats: WorkoutOverviewStats;
}

export function useHealth(): UseHealthResult {
  const [logs, setLogs] = useState<HealthLog[]>(() => healthStorage.getHealthLogs());
  const [bodyMetricLogs, setBodyMetricLogs] = useState<BodyMetricLog[]>(() =>
    healthStorage.getBodyMetricLogs(),
  );
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(() =>
    healthStorage.getWorkoutLogs(),
  );
  const [nutritionMeals, setNutritionMeals] = useState<NutritionMeal[]>(() =>
    healthStorage.getNutritionMeals(),
  );
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(() =>
    healthStorage.getMealTemplates(),
  );
  const [recoveryCheckIns, setRecoveryCheckIns] = useState<RecoveryCheckIn[]>(() =>
    healthStorage.getRecoveryCheckIns(),
  );
  const overviewStats = useMemo(() => calculateHealthOverviewStats(logs), [logs]);
  const bodyMetricOverviewStats = useMemo(
    () => calculateBodyMetricOverviewStats(bodyMetricLogs),
    [bodyMetricLogs],
  );
  const workoutOverviewStats = useMemo(
    () => calculateWorkoutOverviewStats(workoutLogs),
    [workoutLogs],
  );
  const nutritionOverviewStats = useMemo(
    () => calculateNutritionOverviewStats(nutritionMeals, mealTemplates),
    [nutritionMeals, mealTemplates],
  );
  const recoveryOverviewStats = useMemo(
    () => calculateRecoveryOverviewStats(recoveryCheckIns, workoutLogs, logs),
    [recoveryCheckIns, workoutLogs, logs],
  );

  function saveTodayLog(input: HealthLogInput): void {
    setLogs(healthStorage.upsertTodayHealthLog(input));
  }

  function deleteLog(id: string): void {
    setLogs(healthStorage.deleteHealthLog(id));
  }

  function saveTodayBodyMetricLog(input: BodyMetricLogInput): void {
    setBodyMetricLogs(healthStorage.upsertTodayBodyMetricLog(input));
  }

  function deleteBodyMetricLog(id: string): void {
    setBodyMetricLogs(healthStorage.deleteBodyMetricLog(id));
  }

  function saveWorkoutLog(input: WorkoutLogInput): void {
    setWorkoutLogs(healthStorage.upsertTodayWorkoutLog(input));
  }

  function deleteWorkoutLog(id: string): void {
    setWorkoutLogs(healthStorage.deleteWorkoutLog(id));
  }

  function saveNutritionMeal(input: NutritionMealInput): void {
    setNutritionMeals(healthStorage.saveNutritionMeal(input));
  }

  function deleteNutritionMeal(id: string): void {
    setNutritionMeals(healthStorage.deleteNutritionMeal(id));
  }

  function saveMealTemplate(input: MealTemplateInput): void {
    setMealTemplates(healthStorage.saveMealTemplate(input));
  }

  function deleteMealTemplate(id: string): void {
    setMealTemplates(healthStorage.deleteMealTemplate(id));
  }

  function saveTodayRecoveryCheckIn(input: RecoveryCheckInInput): void {
    setRecoveryCheckIns(healthStorage.upsertTodayRecoveryCheckIn(input));
  }

  function deleteRecoveryCheckIn(id: string): void {
    setRecoveryCheckIns(healthStorage.deleteRecoveryCheckIn(id));
  }

  return {
    bodyMetricLogs,
    bodyMetricOverviewStats,
    deleteBodyMetricLog,
    deleteLog,
    deleteMealTemplate,
    deleteNutritionMeal,
    deleteRecoveryCheckIn,
    deleteWorkoutLog,
    logs,
    mealTemplates,
    nutritionMeals,
    nutritionOverviewStats,
    overviewStats,
    recoveryCheckIns,
    recoveryOverviewStats,
    saveMealTemplate,
    saveNutritionMeal,
    saveTodayRecoveryCheckIn,
    saveTodayBodyMetricLog,
    saveTodayLog,
    saveWorkoutLog,
    workoutLogs,
    workoutOverviewStats,
  };
}
