import {
  BodyMetricLog,
  BodyMetricOverviewStats,
  BodyMetricTrendPoint,
  HealthLog,
  HealthMetricStatus,
  HealthOverviewStats,
  HealthScoreBreakdown,
  MealTemplate,
  NutritionMeal,
  NutritionMealTotals,
  NutritionOverviewStats,
  ReadinessBreakdown,
  ReadinessResult,
  ReadinessStatus,
  RecoveryCheckIn,
  RecoveryOverviewStats,
  SuggestedActivity,
  WorkoutIntensity,
  WorkoutLog,
  WorkoutOverviewStats,
} from "@/features/health/types/health.types";
import { DEFAULT_NUTRITION_TARGETS } from "@/features/health/data/nutritionTargets";

const RECENT_WINDOW_SIZE = 7;

export function calculateHealthScore(log: HealthLog): HealthScoreBreakdown {
  const sleepStatus = calculateSleepStatus(log.sleepHours);
  const waterStatus = calculateWaterStatus(log.waterLiters);
  const workoutStatus = calculateWorkoutStatus(
    log.workoutMinutes,
    log.workoutCompleted,
  );
  const energyStatus = calculateEnergyStatus(log.energyLevel);
  const stressStatus = calculateStressStatus(log.stressLevel);

  const sleep = scoreByLevel(sleepStatus, 25, 14, 5);
  const water = scoreByLevel(waterStatus, 20, 11, 4);
  const workout = scoreByLevel(workoutStatus, 20, 11, 3);
  const energy = scoreByLevel(energyStatus, 15, 8, 3);
  const stress = scoreByLevel(stressStatus, 20, 11, 4);
  const total = Math.min(100, Math.max(0, sleep + water + workout + energy + stress));

  return {
    total,
    sleep,
    water,
    workout,
    energy,
    stress,
    details: {
      sleep: sleepStatus,
      water: waterStatus,
      workout: workoutStatus,
      energy: energyStatus,
      stress: stressStatus,
    },
  };
}

export function calculateHealthOverviewStats(logs: HealthLog[]): HealthOverviewStats {
  const sortedLogs = sortHealthLogs(logs);
  const todayLog = sortedLogs.find((log) => log.date === getTodayDateKey()) ?? null;
  const recentLogs = sortedLogs.slice(0, RECENT_WINDOW_SIZE);

  return {
    todayLog,
    todayScore: todayLog ? calculateHealthScore(todayLog) : null,
    latestWeightKg: sortedLogs.find((log) => log.weightKg > 0)?.weightKg ?? null,
    averageSleepHours: averageMetric(recentLogs, (log) => log.sleepHours),
    averageWaterLiters: averageMetric(recentLogs, (log) => log.waterLiters),
    workoutDaysLast7: recentLogs.filter(
      (log) => log.workoutCompleted || log.workoutMinutes >= 10,
    ).length,
    logCount: sortedLogs.length,
  };
}

export function calculateSleepStatus(hours: number): HealthMetricStatus {
  if (hours >= 7 && hours <= 9) {
    return {
      status: "On target",
      helper: "Seven to nine hours supports solid recovery for most adults.",
      level: "good",
    };
  }

  if ((hours >= 6 && hours < 7) || (hours > 9 && hours <= 10)) {
    return {
      status: "Close",
      helper: "This is near the target range, but recovery may vary.",
      level: "ok",
    };
  }

  return {
    status: "Needs attention",
    helper: "Your sleep is outside the simple Phase 1 target range.",
    level: "low",
  };
}

export function calculateWaterStatus(liters: number): HealthMetricStatus {
  if (liters >= 2 && liters <= 3.5) {
    return {
      status: "On target",
      helper: "Hydration is in the current daily target range.",
      level: "good",
    };
  }

  if (liters >= 1.2 && liters < 2) {
    return {
      status: "Could improve",
      helper: "You are close to the target range for today.",
      level: "ok",
    };
  }

  return {
    status: "Low",
    helper: "Log more water when you hydrate today.",
    level: "low",
  };
}

export function calculateWorkoutStatus(
  minutes: number,
  completed: boolean,
): HealthMetricStatus {
  if (completed || minutes >= 30) {
    return {
      status: "Completed",
      helper: "Today's movement goal is marked complete.",
      level: "good",
    };
  }

  if (minutes >= 10 && minutes < 30) {
    return {
      status: "Partial",
      helper: "Some movement is logged for today.",
      level: "ok",
    };
  }

  return {
    status: "Not logged",
    helper: "Add a workout or short walk when it happens.",
    level: "low",
  };
}

export function calculateStressStatus(level: number): HealthMetricStatus {
  if (level <= 2) {
    return {
      status: "Low",
      helper: "Stress is low in today's check-in.",
      level: "good",
    };
  }

  if (level === 3) {
    return {
      status: "Moderate",
      helper: "Stress is neutral today.",
      level: "ok",
    };
  }

  return {
    status: "High",
    helper: "Keep the next step gentle and recovery-focused.",
    level: "low",
  };
}

export function calculateEnergyStatus(level: number): HealthMetricStatus {
  if (level >= 4) {
    return {
      status: "Strong",
      helper: "Energy is high in today's check-in.",
      level: "good",
    };
  }

  if (level === 3) {
    return {
      status: "Steady",
      helper: "Energy is around the middle today.",
      level: "ok",
    };
  }

  return {
    status: "Low",
    helper: "Keep the day realistic and recovery-aware.",
    level: "low",
  };
}

export function getHealthScoreStatus(score: number): string {
  if (score >= 80) {
    return "Good";
  }

  if (score >= 55) {
    return "Fair";
  }

  return "Needs attention";
}

export function calculateBmi(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightMeters = heightCm / 100;

  return roundToOneDecimal(weightKg / (heightMeters * heightMeters));
}

export function getBmiStatus(bmi: number | null): string {
  if (bmi === null) {
    return "Not enough data";
  }

  if (bmi < 18.5) {
    return "Underweight";
  }

  if (bmi <= 24.9) {
    return "Healthy";
  }

  if (bmi <= 29.9) {
    return "Overweight";
  }

  return "Obese";
}

export function calculateBodyMetricOverviewStats(
  logs: BodyMetricLog[],
): BodyMetricOverviewStats {
  const sortedLogs = sortBodyMetricLogs(logs);
  const latestLog = sortedLogs[0];
  const previousLog = sortedLogs[1];
  const latestBmi = latestLog
    ? calculateBmi(latestLog.weightKg, latestLog.heightCm)
    : null;

  return {
    latestWeightKg: getMetricValue(latestLog?.weightKg),
    latestHeightCm: getMetricValue(latestLog?.heightCm),
    latestBmi,
    latestBmiStatus: getBmiStatus(latestBmi),
    latestBodyFatPercent: getMetricValue(latestLog?.bodyFatPercent),
    latestMuscleMassKg: getMetricValue(latestLog?.muscleMassKg),
    latestWaistCm: getMetricValue(latestLog?.waistCm),
    weightChangeFromPrevious: calculateMetricChange(
      latestLog?.weightKg,
      previousLog?.weightKg,
    ),
    bodyFatChangeFromPrevious: calculateMetricChange(
      latestLog?.bodyFatPercent,
      previousLog?.bodyFatPercent,
    ),
    waistChangeFromPrevious: calculateMetricChange(
      latestLog?.waistCm,
      previousLog?.waistCm,
    ),
    totalEntries: sortedLogs.length,
  };
}

export function calculateBodyMetricTrend(logs: BodyMetricLog[]): BodyMetricTrendPoint[] {
  return sortBodyMetricLogs(logs)
    .slice(0, 7)
    .reverse()
    .map((log) => ({
      id: log.id,
      date: log.date,
      weightKg: getMetricValue(log.weightKg),
      bmi: calculateBmi(log.weightKg, log.heightCm),
      bodyFatPercent: getMetricValue(log.bodyFatPercent),
      waistCm: getMetricValue(log.waistCm),
    }));
}

export function calculateWorkoutOverviewStats(
  logs: WorkoutLog[],
): WorkoutOverviewStats {
  const sortedLogs = sortWorkoutLogs(logs);
  const completedLogs = sortedLogs.filter((log) => log.completed);

  return {
    todayWorkout: sortedLogs.find((log) => log.date === getTodayDateKey()) ?? null,
    weeklyWorkoutMinutes: calculateWeeklyWorkoutMinutes(sortedLogs),
    weeklyWorkoutCount: calculateWeeklyWorkoutCount(sortedLogs),
    workoutStreak: calculateWorkoutStreak(sortedLogs),
    totalCompletedWorkouts: completedLogs.length,
    latestWorkout: sortedLogs[0] ?? null,
    averageEffort: calculateAverageEffort(completedLogs),
  };
}

export function calculateWorkoutStreak(logs: WorkoutLog[]): number {
  const completedDates = new Set(
    logs.filter((log) => log.completed).map((log) => log.date),
  );
  const today = new Date(`${getTodayDateKey()}T00:00:00`);
  const yesterday = addDays(today, -1);
  let cursor = completedDates.has(formatDateKey(today)) ? today : yesterday;

  if (!completedDates.has(formatDateKey(cursor))) {
    return 0;
  }

  let streak = 0;

  while (completedDates.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function calculateWeeklyWorkoutMinutes(logs: WorkoutLog[]): number {
  return getCurrentWeekCompletedLogs(logs).reduce(
    (sum, log) => sum + log.durationMinutes,
    0,
  );
}

export function calculateWeeklyWorkoutCount(logs: WorkoutLog[]): number {
  return getCurrentWeekCompletedLogs(logs).length;
}

export function calculateAverageEffort(logs: WorkoutLog[]): number {
  const efforts = logs
    .map((log) => log.perceivedEffort)
    .filter((effort) => effort >= 1 && effort <= 10);

  if (efforts.length === 0) {
    return 0;
  }

  const total = efforts.reduce((sum, effort) => sum + effort, 0);

  return roundToOneDecimal(total / efforts.length);
}

export function estimateWorkoutCalories(
  durationMinutes: number,
  intensity: WorkoutIntensity,
): number {
  const multiplier = intensity === "Low" ? 4 : intensity === "Medium" ? 7 : 10;

  return Math.round(Math.max(0, durationMinutes) * multiplier);
}

export function calculateMealTotals(meal: Pick<NutritionMeal, "items" | "waterLiters">): NutritionMealTotals {
  return meal.items.reduce<NutritionMealTotals>(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      proteinGrams: totals.proteinGrams + item.proteinGrams,
      carbsGrams: totals.carbsGrams + item.carbsGrams,
      fatGrams: totals.fatGrams + item.fatGrams,
      fiberGrams: totals.fiberGrams + item.fiberGrams,
      sugarGrams: totals.sugarGrams + item.sugarGrams,
      sodiumMg: totals.sodiumMg + item.sodiumMg,
      waterLiters: totals.waterLiters,
    }),
    {
      calories: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
      sugarGrams: 0,
      sodiumMg: 0,
      waterLiters: meal.waterLiters,
    },
  );
}

export function calculateNutritionOverviewStats(
  meals: NutritionMeal[],
  templates: MealTemplate[],
): NutritionOverviewStats {
  const todayTotals = calculateTodayNutritionTotals(meals);
  const todayMeals = meals.filter((meal) => meal.date === getTodayDateKey());
  const sortedMeals = sortNutritionMeals(meals);

  return {
    todayCalories: todayTotals.calories,
    todayProteinGrams: todayTotals.proteinGrams,
    todayCarbsGrams: todayTotals.carbsGrams,
    todayFatGrams: todayTotals.fatGrams,
    todayWaterLiters: todayTotals.waterLiters,
    todayMealCount: todayMeals.length,
    proteinTargetProgress: calculateNutritionTargetProgress(
      todayTotals.proteinGrams,
      DEFAULT_NUTRITION_TARGETS.proteinGrams,
    ),
    calorieTargetProgress: calculateNutritionTargetProgress(
      todayTotals.calories,
      DEFAULT_NUTRITION_TARGETS.calories,
    ),
    latestMeal: sortedMeals[0] ?? null,
    totalTemplates: templates.length,
  };
}

export function calculateTodayNutritionTotals(meals: NutritionMeal[]): NutritionMealTotals {
  return meals
    .filter((meal) => meal.date === getTodayDateKey())
    .reduce<NutritionMealTotals>(
      (totals, meal) => {
        const mealTotals = calculateMealTotals(meal);

        return {
          calories: totals.calories + mealTotals.calories,
          proteinGrams: totals.proteinGrams + mealTotals.proteinGrams,
          carbsGrams: totals.carbsGrams + mealTotals.carbsGrams,
          fatGrams: totals.fatGrams + mealTotals.fatGrams,
          fiberGrams: totals.fiberGrams + mealTotals.fiberGrams,
          sugarGrams: totals.sugarGrams + mealTotals.sugarGrams,
          sodiumMg: totals.sodiumMg + mealTotals.sodiumMg,
          waterLiters: roundToOneDecimal(totals.waterLiters + mealTotals.waterLiters),
        };
      },
      {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
        sugarGrams: 0,
        sodiumMg: 0,
        waterLiters: 0,
      },
    );
}

export function calculateNutritionTargetProgress(value: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.round((value / target) * 100);
}

export function getNutritionStatus(stats: NutritionOverviewStats): string {
  if (stats.todayMealCount === 0) {
    return "No meals logged";
  }

  if (stats.calorieTargetProgress >= 80 && stats.proteinTargetProgress >= 80) {
    return "On track";
  }

  return "In progress";
}

interface ReadinessScoreParams {
  checkIn: RecoveryCheckIn;
  workoutLogs: WorkoutLog[];
  healthLogs: HealthLog[];
}

export function calculateReadinessScore({
  checkIn,
  healthLogs,
  workoutLogs,
}: ReadinessScoreParams): ReadinessResult {
  const breakdown: ReadinessBreakdown = {
    sleepScore: scoreSleepQuality(checkIn.sleepQuality),
    stressScore: scoreStressLevel(checkIn.stressLevel),
    energyScore: scoreEnergyLevel(checkIn.energyLevel),
    sorenessScore: scoreSorenessLevel(checkIn.sorenessLevel),
    workoutLoadScore: scoreWorkoutLoad(checkIn.date, workoutLogs),
    moodScore: scoreMoodLevel(checkIn.moodLevel),
  };
  const warnings = detectRecoveryWarnings(checkIn, workoutLogs, healthLogs);
  const score = clampScore(
    breakdown.sleepScore +
      breakdown.stressScore +
      breakdown.energyScore +
      breakdown.sorenessScore +
      breakdown.workoutLoadScore +
      breakdown.moodScore,
  );
  const status = getReadinessStatus(score);
  const suggestedActivity = getSuggestedActivity(score, warnings);
  const recommendation = getReadinessRecommendation(status);

  return {
    score,
    status,
    recommendationTitle: recommendation.title,
    recommendationText: recommendation.text,
    suggestedActivity,
    warnings,
    breakdown,
  };
}

export function calculateRecoveryOverviewStats(
  checkIns: RecoveryCheckIn[],
  workoutLogs: WorkoutLog[],
  healthLogs: HealthLog[],
): RecoveryOverviewStats {
  const sortedCheckIns = sortRecoveryCheckIns(checkIns);
  const todayCheckIn =
    sortedCheckIns.find((checkIn) => checkIn.date === getTodayDateKey()) ?? null;
  const readiness = todayCheckIn
    ? calculateReadinessScore({ checkIn: todayCheckIn, workoutLogs, healthLogs })
    : null;
  const latestCheckIn = sortedCheckIns[0];
  const latestReadiness = latestCheckIn
    ? calculateReadinessScore({ checkIn: latestCheckIn, workoutLogs, healthLogs })
    : null;

  return {
    todayCheckIn,
    readiness,
    averageReadiness7Days: calculateAverageReadiness7Days(
      sortedCheckIns,
      workoutLogs,
      healthLogs,
    ),
    recoveryStreak: calculateRecoveryStreak(sortedCheckIns),
    latestWarning: latestReadiness?.warnings[0] ?? null,
    suggestedActivity: readiness?.suggestedActivity ?? null,
  };
}

export function calculateRecoveryStreak(checkIns: RecoveryCheckIn[]): number {
  const checkInDates = new Set(checkIns.map((checkIn) => checkIn.date));
  let cursor = new Date(`${getTodayDateKey()}T00:00:00`);

  if (!checkInDates.has(formatDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  if (!checkInDates.has(formatDateKey(cursor))) {
    return 0;
  }

  let streak = 0;

  while (checkInDates.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function calculateAverageReadiness7Days(
  checkIns: RecoveryCheckIn[],
  workoutLogs: WorkoutLog[],
  healthLogs: HealthLog[],
): number {
  const recentCheckIns = sortRecoveryCheckIns(checkIns).slice(0, 7);

  if (recentCheckIns.length === 0) {
    return 0;
  }

  const total = recentCheckIns.reduce(
    (sum, checkIn) =>
      sum + calculateReadinessScore({ checkIn, workoutLogs, healthLogs }).score,
    0,
  );

  return roundToOneDecimal(total / recentCheckIns.length);
}

export function detectRecoveryWarnings(
  checkIn: RecoveryCheckIn,
  workoutLogs: WorkoutLog[],
  healthLogs: HealthLog[],
): string[] {
  const warnings: string[] = [];

  if (checkIn.sleepQuality <= 2 || hasLowSleepQuickLog(checkIn.date, healthLogs)) {
    warnings.push("Low sleep quality");
  }

  if (checkIn.stressLevel >= 4) {
    warnings.push("High stress");
  }

  if (checkIn.sorenessLevel >= 4) {
    warnings.push("High soreness");
  }

  if (checkIn.energyLevel <= 2) {
    warnings.push("Low energy");
  }

  if (hasConsecutiveHighIntensityWorkouts(checkIn.date, workoutLogs)) {
    warnings.push("High training load");
  }

  if (getRecentCompletedWorkoutCount(checkIn.date, workoutLogs, 3) >= 3) {
    warnings.push("Possible insufficient recovery");
  }

  return Array.from(new Set(warnings));
}

export function getSuggestedActivity(
  readinessScore: number,
  warnings: string[],
): SuggestedActivity {
  const hasSeriousWarning = warnings.some(
    (warning) =>
      warning === "High training load" ||
      warning === "Possible insufficient recovery" ||
      warning === "High stress" ||
      warning === "High soreness",
  );

  if (readinessScore >= 85 && !hasSeriousWarning) {
    return "Heavy Training";
  }

  if (readinessScore >= 70) {
    return "Normal Training";
  }

  if (readinessScore >= 50) {
    return "Light Cardio";
  }

  if (readinessScore >= 35) {
    return "Mobility";
  }

  return "Rest Day";
}

export function sortHealthLogs(logs: HealthLog[]): HealthLog[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date));
}

export function sortBodyMetricLogs(logs: BodyMetricLog[]): BodyMetricLog[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date));
}

export function sortWorkoutLogs(logs: WorkoutLog[]): WorkoutLog[] {
  return [...logs].sort((first, second) => second.date.localeCompare(first.date));
}

export function sortNutritionMeals(meals: NutritionMeal[]): NutritionMeal[] {
  return [...meals].sort((first, second) => {
    const dateComparison = second.date.localeCompare(first.date);

    return dateComparison === 0
      ? second.createdAt.localeCompare(first.createdAt)
      : dateComparison;
  });
}

export function sortRecoveryCheckIns(checkIns: RecoveryCheckIn[]): RecoveryCheckIn[] {
  return [...checkIns].sort((first, second) => second.date.localeCompare(first.date));
}

export function sortMealTemplates(templates: MealTemplate[]): MealTemplate[] {
  return [...templates].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  );
}

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function averageMetric(logs: HealthLog[], selector: (log: HealthLog) => number): number {
  const values = logs.map(selector).filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return roundToOneDecimal(total / values.length);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getMetricValue(value: number | undefined): number | null {
  return value !== undefined && value > 0 ? value : null;
}

function calculateMetricChange(
  latestValue: number | undefined,
  previousValue: number | undefined,
): number | null {
  if (
    latestValue === undefined ||
    previousValue === undefined ||
    latestValue <= 0 ||
    previousValue <= 0
  ) {
    return null;
  }

  return roundToOneDecimal(latestValue - previousValue);
}

function getCurrentWeekCompletedLogs(logs: WorkoutLog[]): WorkoutLog[] {
  const today = new Date(`${getTodayDateKey()}T00:00:00`);
  const weekStart = addDays(today, -6);

  return logs.filter((log) => {
    const logDate = new Date(`${log.date}T00:00:00`);

    return log.completed && logDate >= weekStart && logDate <= today;
  });
}

function scoreSleepQuality(value: number): number {
  const scores: Record<number, number> = { 1: 3, 2: 8, 3: 14, 4: 20, 5: 25 };

  return scores[value] ?? 0;
}

function scoreStressLevel(value: number): number {
  const scores: Record<number, number> = { 1: 20, 2: 16, 3: 10, 4: 5, 5: 0 };

  return scores[value] ?? 0;
}

function scoreEnergyLevel(value: number): number {
  const scores: Record<number, number> = { 1: 0, 2: 5, 3: 10, 4: 16, 5: 20 };

  return scores[value] ?? 0;
}

function scoreSorenessLevel(value: number): number {
  const scores: Record<number, number> = { 1: 15, 2: 12, 3: 8, 4: 4, 5: 0 };

  return scores[value] ?? 0;
}

function scoreMoodLevel(value: number): number {
  const scores: Record<number, number> = { 1: 0, 2: 2, 3: 5, 4: 8, 5: 10 };

  return scores[value] ?? 0;
}

function scoreWorkoutLoad(dateKey: string, workoutLogs: WorkoutLog[]): number {
  const yesterdayWorkout = getWorkoutForDate(addDaysToDateKey(dateKey, -1), workoutLogs);

  if (!yesterdayWorkout) {
    return 10;
  }

  if (yesterdayWorkout.intensity === "High" && yesterdayWorkout.durationMinutes >= 60) {
    return 2;
  }

  if (yesterdayWorkout.intensity === "High") {
    return 4;
  }

  if (yesterdayWorkout.intensity === "Medium" && yesterdayWorkout.durationMinutes >= 60) {
    return 6;
  }

  return 8;
}

function getWorkoutForDate(dateKey: string, workoutLogs: WorkoutLog[]): WorkoutLog | null {
  return (
    workoutLogs.find((log) => log.date === dateKey && log.completed) ??
    workoutLogs.find((log) => log.date === dateKey) ??
    null
  );
}

function hasConsecutiveHighIntensityWorkouts(
  dateKey: string,
  workoutLogs: WorkoutLog[],
): boolean {
  const yesterday = getWorkoutForDate(addDaysToDateKey(dateKey, -1), workoutLogs);
  const twoDaysAgo = getWorkoutForDate(addDaysToDateKey(dateKey, -2), workoutLogs);

  return (
    yesterday?.completed === true &&
    yesterday.intensity === "High" &&
    twoDaysAgo?.completed === true &&
    twoDaysAgo.intensity === "High"
  );
}

function getRecentCompletedWorkoutCount(
  dateKey: string,
  workoutLogs: WorkoutLog[],
  days: number,
): number {
  const endDate = new Date(`${dateKey}T00:00:00`);
  const startDate = addDays(endDate, -(days - 1));

  return workoutLogs.filter((log) => {
    const logDate = new Date(`${log.date}T00:00:00`);

    return log.completed && logDate >= startDate && logDate <= endDate;
  }).length;
}

function hasLowSleepQuickLog(dateKey: string, healthLogs: HealthLog[]): boolean {
  const log = healthLogs.find((healthLog) => healthLog.date === dateKey);

  return log !== undefined && log.sleepHours > 0 && log.sleepHours < 6;
}

function getReadinessStatus(score: number): ReadinessStatus {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 50) {
    return "Moderate";
  }

  return "Low";
}

function getReadinessRecommendation(status: ReadinessStatus): {
  title: string;
  text: string;
} {
  if (status === "Excellent") {
    return {
      title: "Strong readiness",
      text: "Your recovery looks strong. You can train normally if you feel good.",
    };
  }

  if (status === "Good") {
    return {
      title: "Ready to train",
      text: "You are ready for a productive session. Keep hydration and warm-up in mind.",
    };
  }

  if (status === "Moderate") {
    return {
      title: "Keep it lighter",
      text: "Choose a lighter session today and prioritize sleep tonight.",
    };
  }

  return {
    title: "Prioritize recovery",
    text: "Consider recovery work, walking, mobility, or rest today.",
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function addDaysToDateKey(dateKey: string, days: number): string {
  return formatDateKey(addDays(new Date(`${dateKey}T00:00:00`), days));
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function scoreByLevel(
  status: HealthMetricStatus,
  fullScore: number,
  mediumScore: number,
  lowScore: number,
): number {
  if (status.level === "good") {
    return fullScore;
  }

  if (status.level === "ok") {
    return mediumScore;
  }

  return lowScore;
}
