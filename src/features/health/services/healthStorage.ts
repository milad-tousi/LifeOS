import { createId } from "@/lib/id";
import {
  getTodayDateKey,
  sortHealthLogs,
} from "@/features/health/services/healthCalculations";
import {
  BodyMetricLog,
  BodyMetricLogInput,
  HealthLog,
  HealthLogInput,
  HealthRating,
  MealTemplate,
  MealTemplateInput,
  NutritionFoodItem,
  NutritionMeal,
  NutritionMealInput,
  NutritionMealType,
  RecoveryCheckIn,
  RecoveryCheckInInput,
  RecoveryRating,
  RestingFeeling,
  WorkoutExercise,
  WorkoutIntensity,
  WorkoutLog,
  WorkoutLogInput,
} from "@/features/health/types/health.types";

const HEALTH_LOGS_STORAGE_KEY = "lifeos:health:logs:v1";
const BODY_METRIC_LOGS_STORAGE_KEY = "lifeos:health:body-metrics:v1";
const WORKOUT_LOGS_STORAGE_KEY = "lifeos:health:workouts:v1";
const NUTRITION_MEALS_STORAGE_KEY = "lifeos:health:nutrition-meals:v1";
const MEAL_TEMPLATES_STORAGE_KEY = "lifeos:health:meal-templates:v1";
const RECOVERY_CHECK_INS_STORAGE_KEY = "lifeos:health:recovery-checkins:v1";

export const healthStorage = {
  getHealthLogs,
  saveHealthLog,
  deleteHealthLog,
  getTodayHealthLog,
  upsertTodayHealthLog,
  clearHealthLogs,
  getBodyMetricLogs,
  saveBodyMetricLog,
  deleteBodyMetricLog,
  getTodayBodyMetricLog,
  upsertTodayBodyMetricLog,
  clearBodyMetricLogs,
  getWorkoutLogs,
  saveWorkoutLog,
  deleteWorkoutLog,
  getTodayWorkoutLog,
  upsertTodayWorkoutLog,
  clearWorkoutLogs,
  getNutritionMeals,
  saveNutritionMeal,
  deleteNutritionMeal,
  getTodayNutritionMeals,
  clearNutritionMeals,
  getMealTemplates,
  saveMealTemplate,
  deleteMealTemplate,
  clearMealTemplates,
  getRecoveryCheckIns,
  saveRecoveryCheckIn,
  deleteRecoveryCheckIn,
  getTodayRecoveryCheckIn,
  upsertTodayRecoveryCheckIn,
  clearRecoveryCheckIns,
};

export function getHealthLogs(): HealthLog[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(HEALTH_LOGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return sortHealthLogs(parsedValue.filter(isHealthLog));
  } catch {
    return [];
  }
}

export function saveHealthLog(log: HealthLog): HealthLog[] {
  const logs = getHealthLogs();
  const nextLogs = sortHealthLogs([
    log,
    ...logs.filter((currentLog) => currentLog.id !== log.id),
  ]);

  writeHealthLogs(nextLogs);

  return nextLogs;
}

export function deleteHealthLog(id: string): HealthLog[] {
  const nextLogs = getHealthLogs().filter((log) => log.id !== id);

  writeHealthLogs(nextLogs);

  return nextLogs;
}

export function getTodayHealthLog(): HealthLog | null {
  const today = getTodayDateKey();

  return getHealthLogs().find((log) => log.date === today) ?? null;
}

export function upsertTodayHealthLog(input: HealthLogInput): HealthLog[] {
  const logs = getHealthLogs();
  const today = getTodayDateKey();
  const existingLog = logs.find((log) => log.date === today);
  const now = new Date().toISOString();
  const nextLog: HealthLog = {
    ...input,
    id: existingLog?.id ?? createId(),
    date: today,
    createdAt: existingLog?.createdAt ?? now,
    updatedAt: now,
  };

  return saveHealthLog(nextLog);
}

export function clearHealthLogs(): HealthLog[] {
  writeHealthLogs([]);

  return [];
}

export function getBodyMetricLogs(): BodyMetricLog[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(BODY_METRIC_LOGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return sortBodyMetricLogs(parsedValue.filter(isBodyMetricLog));
  } catch {
    return [];
  }
}

export function saveBodyMetricLog(log: BodyMetricLog): BodyMetricLog[] {
  const logs = getBodyMetricLogs();
  const nextLogs = sortBodyMetricLogs([
    log,
    ...logs.filter((currentLog) => currentLog.id !== log.id),
  ]);

  writeBodyMetricLogs(nextLogs);

  return nextLogs;
}

export function deleteBodyMetricLog(id: string): BodyMetricLog[] {
  const nextLogs = getBodyMetricLogs().filter((log) => log.id !== id);

  writeBodyMetricLogs(nextLogs);

  return nextLogs;
}

export function getTodayBodyMetricLog(): BodyMetricLog | null {
  const today = getTodayDateKey();

  return getBodyMetricLogs().find((log) => log.date === today) ?? null;
}

export function upsertTodayBodyMetricLog(input: BodyMetricLogInput): BodyMetricLog[] {
  const logs = getBodyMetricLogs();
  const today = getTodayDateKey();
  const existingLog = logs.find((log) => log.date === today);
  const now = new Date().toISOString();
  const nextLog: BodyMetricLog = {
    ...input,
    id: existingLog?.id ?? createId(),
    date: today,
    createdAt: existingLog?.createdAt ?? now,
    updatedAt: now,
  };

  return saveBodyMetricLog(nextLog);
}

export function clearBodyMetricLogs(): BodyMetricLog[] {
  writeBodyMetricLogs([]);

  return [];
}

export function getWorkoutLogs(): WorkoutLog[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(WORKOUT_LOGS_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return sortWorkoutLogs(parsedValue.filter(isWorkoutLog));
  } catch {
    return [];
  }
}

export function saveWorkoutLog(log: WorkoutLog): WorkoutLog[] {
  const logs = getWorkoutLogs();
  const nextLogs = sortWorkoutLogs([
    log,
    ...logs.filter((currentLog) => currentLog.id !== log.id),
  ]);

  writeWorkoutLogs(nextLogs);

  return nextLogs;
}

export function deleteWorkoutLog(id: string): WorkoutLog[] {
  const nextLogs = getWorkoutLogs().filter((log) => log.id !== id);

  writeWorkoutLogs(nextLogs);

  return nextLogs;
}

export function getTodayWorkoutLog(): WorkoutLog | null {
  const today = getTodayDateKey();

  return getWorkoutLogs().find((log) => log.date === today) ?? null;
}

export function upsertTodayWorkoutLog(input: WorkoutLogInput): WorkoutLog[] {
  const logs = getWorkoutLogs();
  const existingLog = logs.find((log) => log.date === input.date);
  const now = new Date().toISOString();
  const nextLog: WorkoutLog = {
    ...input,
    id: existingLog?.id ?? createId(),
    createdAt: existingLog?.createdAt ?? now,
    updatedAt: now,
  };

  return saveWorkoutLog(nextLog);
}

export function clearWorkoutLogs(): WorkoutLog[] {
  writeWorkoutLogs([]);

  return [];
}

export function getNutritionMeals(): NutritionMeal[] {
  const parsedValue = readJsonArray(NUTRITION_MEALS_STORAGE_KEY);

  return sortNutritionMeals(parsedValue.filter(isNutritionMeal));
}

export function saveNutritionMeal(input: NutritionMealInput): NutritionMeal[] {
  const meals = getNutritionMeals();
  const now = new Date().toISOString();
  const nextMeal: NutritionMeal = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  const nextMeals = sortNutritionMeals([nextMeal, ...meals]);

  writeNutritionMeals(nextMeals);

  return nextMeals;
}

export function deleteNutritionMeal(id: string): NutritionMeal[] {
  const nextMeals = getNutritionMeals().filter((meal) => meal.id !== id);

  writeNutritionMeals(nextMeals);

  return nextMeals;
}

export function getTodayNutritionMeals(): NutritionMeal[] {
  const today = getTodayDateKey();

  return getNutritionMeals().filter((meal) => meal.date === today);
}

export function clearNutritionMeals(): NutritionMeal[] {
  writeNutritionMeals([]);

  return [];
}

export function getMealTemplates(): MealTemplate[] {
  const parsedValue = readJsonArray(MEAL_TEMPLATES_STORAGE_KEY);

  return sortMealTemplates(parsedValue.filter(isMealTemplate));
}

export function saveMealTemplate(input: MealTemplateInput): MealTemplate[] {
  const templates = getMealTemplates();
  const now = new Date().toISOString();
  const nextTemplate: MealTemplate = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
  const nextTemplates = sortMealTemplates([nextTemplate, ...templates]);

  writeMealTemplates(nextTemplates);

  return nextTemplates;
}

export function deleteMealTemplate(id: string): MealTemplate[] {
  const nextTemplates = getMealTemplates().filter((template) => template.id !== id);

  writeMealTemplates(nextTemplates);

  return nextTemplates;
}

export function clearMealTemplates(): MealTemplate[] {
  writeMealTemplates([]);

  return [];
}

export function getRecoveryCheckIns(): RecoveryCheckIn[] {
  const parsedValue = readJsonArray(RECOVERY_CHECK_INS_STORAGE_KEY);

  return sortRecoveryCheckIns(parsedValue.filter(isRecoveryCheckIn));
}

export function saveRecoveryCheckIn(checkIn: RecoveryCheckIn): RecoveryCheckIn[] {
  const checkIns = getRecoveryCheckIns();
  const nextCheckIns = sortRecoveryCheckIns([
    checkIn,
    ...checkIns.filter((currentCheckIn) => currentCheckIn.id !== checkIn.id),
  ]);

  writeRecoveryCheckIns(nextCheckIns);

  return nextCheckIns;
}

export function deleteRecoveryCheckIn(id: string): RecoveryCheckIn[] {
  const nextCheckIns = getRecoveryCheckIns().filter((checkIn) => checkIn.id !== id);

  writeRecoveryCheckIns(nextCheckIns);

  return nextCheckIns;
}

export function getTodayRecoveryCheckIn(): RecoveryCheckIn | null {
  const today = getTodayDateKey();

  return getRecoveryCheckIns().find((checkIn) => checkIn.date === today) ?? null;
}

export function upsertTodayRecoveryCheckIn(
  input: RecoveryCheckInInput,
): RecoveryCheckIn[] {
  const checkIns = getRecoveryCheckIns();
  const existingCheckIn = checkIns.find((checkIn) => checkIn.date === input.date);
  const now = new Date().toISOString();
  const nextCheckIn: RecoveryCheckIn = {
    ...input,
    id: existingCheckIn?.id ?? createId(),
    createdAt: existingCheckIn?.createdAt ?? now,
    updatedAt: now,
  };

  return saveRecoveryCheckIn(nextCheckIn);
}

export function clearRecoveryCheckIns(): RecoveryCheckIn[] {
  writeRecoveryCheckIns([]);

  return [];
}

function writeHealthLogs(logs: HealthLog[]): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(HEALTH_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    return;
  }
}

function writeBodyMetricLogs(logs: BodyMetricLog[]): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(BODY_METRIC_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    return;
  }
}

function writeWorkoutLogs(logs: WorkoutLog[]): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(WORKOUT_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    return;
  }
}

function writeNutritionMeals(meals: NutritionMeal[]): void {
  writeJsonArray(NUTRITION_MEALS_STORAGE_KEY, meals);
}

function writeMealTemplates(templates: MealTemplate[]): void {
  writeJsonArray(MEAL_TEMPLATES_STORAGE_KEY, templates);
}

function writeRecoveryCheckIns(checkIns: RecoveryCheckIn[]): void {
  writeJsonArray(RECOVERY_CHECK_INS_STORAGE_KEY, checkIns);
}

function readJsonArray(key: string): unknown[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, value: unknown[]): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function isLocalStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isHealthLog(value: unknown): value is HealthLog {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.weightKg === "number" &&
    typeof value.sleepHours === "number" &&
    typeof value.waterLiters === "number" &&
    typeof value.workoutMinutes === "number" &&
    typeof value.workoutCompleted === "boolean" &&
    typeof value.calories === "number" &&
    typeof value.proteinGrams === "number" &&
    isHealthRating(value.energyLevel) &&
    isHealthRating(value.stressLevel) &&
    typeof value.note === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isBodyMetricLog(value: unknown): value is BodyMetricLog {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.weightKg === "number" &&
    typeof value.heightCm === "number" &&
    typeof value.bodyFatPercent === "number" &&
    typeof value.muscleMassKg === "number" &&
    typeof value.waistCm === "number" &&
    typeof value.chestCm === "number" &&
    typeof value.armCm === "number" &&
    typeof value.legCm === "number" &&
    typeof value.note === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isWorkoutLog(value: unknown): value is WorkoutLog {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.title === "string" &&
    isWorkoutType(value.workoutType) &&
    isWorkoutIntensity(value.intensity) &&
    typeof value.durationMinutes === "number" &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutExercise) &&
    typeof value.completed === "boolean" &&
    typeof value.caloriesBurned === "number" &&
    typeof value.perceivedEffort === "number" &&
    typeof value.note === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.exerciseId === "string" &&
    typeof value.name === "string" &&
    typeof value.targetMuscles === "string" &&
    typeof value.equipment === "string" &&
    typeof value.sets === "number" &&
    typeof value.reps === "number" &&
    typeof value.weightKg === "number" &&
    typeof value.durationMinutes === "number" &&
    typeof value.notes === "string"
  );
}

function isNutritionMeal(value: unknown): value is NutritionMeal {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    isNutritionMealType(value.mealType) &&
    typeof value.title === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isNutritionFoodItem) &&
    typeof value.waterLiters === "number" &&
    typeof value.note === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isMealTemplate(value: unknown): value is MealTemplate {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isNutritionMealType(value.mealType) &&
    Array.isArray(value.items) &&
    value.items.every(isNutritionFoodItem) &&
    typeof value.waterLiters === "number" &&
    typeof value.note === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isNutritionFoodItem(value: unknown): value is NutritionFoodItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.quantity === "number" &&
    typeof value.unit === "string" &&
    typeof value.calories === "number" &&
    typeof value.proteinGrams === "number" &&
    typeof value.carbsGrams === "number" &&
    typeof value.fatGrams === "number" &&
    typeof value.fiberGrams === "number" &&
    typeof value.sugarGrams === "number" &&
    typeof value.sodiumMg === "number"
  );
}

function isRecoveryCheckIn(value: unknown): value is RecoveryCheckIn {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    isRecoveryRating(value.sleepQuality) &&
    isRecoveryRating(value.sorenessLevel) &&
    isRecoveryRating(value.moodLevel) &&
    isRecoveryRating(value.energyLevel) &&
    isRecoveryRating(value.stressLevel) &&
    isRestingFeeling(value.restingFeeling) &&
    typeof value.note === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function sortBodyMetricLogs(logs: BodyMetricLog[]): BodyMetricLog[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date));
}

function sortWorkoutLogs(logs: WorkoutLog[]): WorkoutLog[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date));
}

function sortNutritionMeals(meals: NutritionMeal[]): NutritionMeal[] {
  return [...meals].sort((first, second) => {
    const dateComparison = second.date.localeCompare(first.date);

    return dateComparison === 0
      ? second.createdAt.localeCompare(first.createdAt)
      : dateComparison;
  });
}

function sortMealTemplates(templates: MealTemplate[]): MealTemplate[] {
  return [...templates].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  );
}

function sortRecoveryCheckIns(checkIns: RecoveryCheckIn[]): RecoveryCheckIn[] {
  return [...checkIns].sort((first, second) => second.date.localeCompare(first.date));
}

function isHealthRating(value: unknown): value is HealthRating {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function isWorkoutType(value: unknown): boolean {
  return (
    value === "Strength" ||
    value === "Cardio" ||
    value === "Mobility" ||
    value === "Stretching" ||
    value === "Mixed" ||
    value === "Custom"
  );
}

function isWorkoutIntensity(value: unknown): value is WorkoutIntensity {
  return value === "Low" || value === "Medium" || value === "High";
}

function isNutritionMealType(value: unknown): value is NutritionMealType {
  return (
    value === "Breakfast" ||
    value === "Lunch" ||
    value === "Dinner" ||
    value === "Snack" ||
    value === "Pre-workout" ||
    value === "Post-workout" ||
    value === "Custom"
  );
}

function isRecoveryRating(value: unknown): value is RecoveryRating {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function isRestingFeeling(value: unknown): value is RestingFeeling {
  return (
    value === "Fresh" ||
    value === "Normal" ||
    value === "Tired" ||
    value === "Exhausted"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
