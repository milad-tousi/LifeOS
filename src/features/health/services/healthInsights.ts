import { DEFAULT_NUTRITION_TARGETS } from "@/features/health/data/nutritionTargets";
import {
  BodyMetricLog,
  HealthDataCoverage,
  HealthInsight,
  HealthInsightConfidence,
  HealthInsightOverviewStats,
  HealthLog,
  NutritionMeal,
  RecoveryCheckIn,
  WeeklyHealthFocus,
  WorkoutLog,
} from "@/features/health/types/health.types";
import {
  calculateMealTotals,
  calculateReadinessScore,
  getTodayDateKey,
  sortBodyMetricLogs,
} from "@/features/health/services/healthCalculations";

export interface HealthInsightParams {
  healthLogs: HealthLog[];
  bodyMetricLogs: BodyMetricLog[];
  workoutLogs: WorkoutLog[];
  nutritionMeals: NutritionMeal[];
  recoveryCheckIns: RecoveryCheckIn[];
}

const LOOKBACK_7_DAYS = 7;
const LOOKBACK_14_DAYS = 14;

export function calculateHealthDataCoverage({
  bodyMetricLogs,
  healthLogs,
  nutritionMeals,
  recoveryCheckIns,
  workoutLogs,
}: HealthInsightParams): HealthDataCoverage {
  const healthLogsCount = countRecent(healthLogs, LOOKBACK_14_DAYS);
  const bodyMetricsCount = countRecent(bodyMetricLogs, LOOKBACK_14_DAYS);
  const workoutLogsCount = countRecent(workoutLogs, LOOKBACK_14_DAYS);
  const nutritionMealsCount = countRecent(nutritionMeals, LOOKBACK_14_DAYS);
  const recoveryCheckInsCount = countRecent(recoveryCheckIns, LOOKBACK_14_DAYS);
  const areas = [
    { label: "health logs", count: healthLogsCount },
    { label: "body metrics", count: bodyMetricsCount },
    { label: "workouts", count: workoutLogsCount },
    { label: "nutrition", count: nutritionMealsCount },
    { label: "recovery", count: recoveryCheckInsCount },
  ];

  return {
    healthLogsCount,
    bodyMetricsCount,
    workoutLogsCount,
    nutritionMealsCount,
    recoveryCheckInsCount,
    coverageScore: areas.reduce((sum, area) => sum + getCoveragePoints(area.count), 0),
    missingAreas: areas.filter((area) => area.count === 0).map((area) => area.label),
  };
}

export function generateHealthInsights(params: HealthInsightParams): HealthInsight[] {
  const insights = [
    ...detectWarningPatterns(params),
    ...detectOpportunities(params),
    ...detectPositivePatterns(params),
  ];

  return insights.sort((first, second) => getInsightPriority(first) - getInsightPriority(second));
}

export function calculateInsightOverviewStats(
  insights: HealthInsight[],
  coverage: HealthDataCoverage,
): HealthInsightOverviewStats {
  const bestPattern =
    insights.find((insight) => insight.type === "Positive")?.title ??
    "Keep logging to reveal patterns";

  return {
    totalInsights: insights.length,
    positivePatterns: insights.filter((insight) => insight.type === "Positive").length,
    warningPatterns: insights.filter((insight) => insight.type === "Warning").length,
    opportunityCount: insights.filter((insight) => insight.type === "Opportunity").length,
    bestPattern,
    weeklyFocus: "",
    dataCoverageScore: coverage.coverageScore,
  };
}

export function getWeeklyHealthFocus(params: HealthInsightParams): WeeklyHealthFocus {
  const coverage = calculateHealthDataCoverage(params);
  const sleepAverage = averageRecentMetric(params.healthLogs, LOOKBACK_7_DAYS, (log) => log.sleepHours);
  const waterAverage = averageRecentMetric(params.healthLogs, LOOKBACK_7_DAYS, (log) => log.waterLiters);
  const workoutCount = getRecentCompletedWorkouts(params.workoutLogs, LOOKBACK_7_DAYS).length;
  const proteinAverage = getRecentProteinAverage(params.nutritionMeals);
  const stressAverage = getAverageStress(params);

  if (coverage.coverageScore < 40) {
    return createWeeklyFocus(
      "Build tracking consistency",
      "More recent logs will make insights more useful.",
      "Add one simple health log or check-in today.",
      ["Log one health check today", "Add one workout or meal log", "Complete recovery check-in tonight"],
    );
  }

  if (sleepAverage > 0 && sleepAverage < 6) {
    return createWeeklyFocus(
      "Improve sleep consistency",
      "Your recent sleep average is below 6 hours.",
      "Prioritize an earlier bedtime for the next 3 nights.",
      ["Set a realistic wind-down time", "Reduce late caffeine", "Log sleep each morning"],
    );
  }

  if (waterAverage > 0 && waterAverage < 1.5) {
    return createWeeklyFocus(
      "Improve hydration",
      "Your recent water average is below 1.5 liters.",
      "Add one extra glass of water in the morning and afternoon.",
      ["Drink water after waking up", "Keep a bottle near your desk", "Log water with meals"],
    );
  }

  if (workoutCount < 2) {
    return createWeeklyFocus(
      "Build movement consistency",
      "Fewer than 2 completed workouts are logged in the last 7 days.",
      "Schedule two short movement sessions this week.",
      ["Pick two training days", "Start with 20 minutes", "Save each workout log"],
    );
  }

  if (proteinAverage > 0 && proteinAverage < DEFAULT_NUTRITION_TARGETS.proteinGrams * 0.7) {
    return createWeeklyFocus(
      "Improve protein intake",
      "Recent protein intake is below 70% of the default demo target.",
      "Add one protein-focused meal or snack.",
      ["Plan a protein breakfast", "Add protein to one snack", "Save one reusable meal template"],
    );
  }

  if (stressAverage >= 4) {
    return createWeeklyFocus(
      "Reduce stress load",
      "Recent stress check-ins are trending high.",
      "Plan a lighter evening routine and avoid stacking too many tasks.",
      ["Protect a quiet evening block", "Choose lighter training", "Log recovery before bed"],
    );
  }

  return createWeeklyFocus(
    "Maintain your current routine",
    "Your recent signals do not show a strong priority area.",
    "Keep logging and continue the habits that are working.",
    ["Keep your current rhythm", "Review insights weekly", "Add missing data when easy"],
  );
}

export function detectPositivePatterns(params: HealthInsightParams): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const completedWorkouts = getRecentCompletedWorkouts(params.workoutLogs, LOOKBACK_7_DAYS);
  const averageReadiness = getAverageReadiness(params);

  if (completedWorkouts.length >= 3) {
    insights.push(
      createInsight({
        id: "workout-consistency",
        type: "Positive",
        title: "Workout consistency is building momentum",
        summary: "You completed at least 3 workouts in the last 7 days.",
        detail: "A steady training rhythm can support long-term progress when recovery stays balanced.",
        confidence: completedWorkouts.length >= 4 ? "High" : "Medium",
        relatedAreas: ["Workout", "Recovery"],
        suggestedAction: "Keep the same training rhythm next week.",
      }),
    );
  }

  if (averageReadiness > 75) {
    insights.push(
      createInsight({
        id: "strong-recovery-trend",
        type: "Positive",
        title: "Recovery trend looks strong",
        summary: "Recent readiness scores are averaging above 75.",
        detail: "Your recovery check-ins suggest a solid recent baseline.",
        confidence: params.recoveryCheckIns.length >= 5 ? "High" : "Medium",
        relatedAreas: ["Recovery", "Energy"],
        suggestedAction: "You can plan a normal training week if you feel good.",
      }),
    );
  }

  return insights;
}

export function detectWarningPatterns(params: HealthInsightParams): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const sleepAverage = averageRecentMetric(params.healthLogs, LOOKBACK_7_DAYS, (log) => log.sleepHours);
  const completedWorkouts3Days = getRecentCompletedWorkouts(params.workoutLogs, 3);
  const stressAverage = getAverageStress(params);
  const weightChange = getSevenDayWeightChange(params.bodyMetricLogs);

  if (sleepAverage > 0 && sleepAverage < 6) {
    insights.push(
      createInsight({
        id: "low-sleep-recovery",
        type: "Warning",
        title: "Low sleep may be limiting recovery",
        summary: "Your average sleep is below 6 hours.",
        detail: "Sleep is one of the clearest recovery signals in this local model.",
        confidence: getConfidence(countRecent(params.healthLogs, LOOKBACK_7_DAYS)),
        relatedAreas: ["Sleep", "Recovery"],
        suggestedAction: "Prioritize an earlier bedtime for the next 3 nights.",
      }),
    );
  }

  if (completedWorkouts3Days.length >= 3) {
    insights.push(
      createInsight({
        id: "high-training-load",
        type: "Warning",
        title: "Training load may be high",
        summary: "You completed 3 or more workouts in the last 3 days.",
        detail: "Stacking workouts can be productive, but lighter days may help recovery catch up.",
        confidence: "High",
        relatedAreas: ["Workout", "Recovery"],
        suggestedAction: "Consider mobility or light cardio today.",
      }),
    );
  }

  if (stressAverage >= 4) {
    insights.push(
      createInsight({
        id: "stress-trending-high",
        type: "Warning",
        title: "Stress is trending high",
        summary: "Recent stress ratings average 4 or higher.",
        detail: "This is a general wellness signal from your check-ins, not a diagnosis.",
        confidence: "Medium",
        relatedAreas: ["Stress", "Recovery"],
        suggestedAction: "Plan a lighter evening routine and avoid stacking too many tasks.",
      }),
    );
  }

  if (Math.abs(weightChange) > 2) {
    insights.push(
      createInsight({
        id: "fast-weight-change",
        type: "Pattern",
        title: "Fast weight change detected",
        summary: `Weight changed by ${formatSigned(weightChange)} kg across recent logs.`,
        detail: "This can happen from hydration, sodium, food volume, or calorie changes.",
        confidence: "Medium",
        relatedAreas: ["Body Metrics", "Nutrition", "Hydration"],
        suggestedAction: "Track weight for a few more days before making major changes.",
      }),
    );
  }

  return insights;
}

export function detectOpportunities(params: HealthInsightParams): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const waterAverage = averageRecentMetric(params.healthLogs, LOOKBACK_7_DAYS, (log) => log.waterLiters);
  const proteinAverage = getRecentProteinAverage(params.nutritionMeals);

  if (waterAverage > 0 && waterAverage < 1.5) {
    insights.push(
      createInsight({
        id: "hydration-baseline",
        type: "Opportunity",
        title: "Hydration can improve your daily baseline",
        summary: "Your recent water average is below 1.5 liters.",
        detail: "Small hydration routines are often easier to maintain than large one-time changes.",
        confidence: getConfidence(countRecent(params.healthLogs, LOOKBACK_7_DAYS)),
        relatedAreas: ["Hydration", "Energy"],
        suggestedAction: "Add one extra glass of water in the morning and afternoon.",
      }),
    );
  }

  if (proteinAverage > 0 && proteinAverage < DEFAULT_NUTRITION_TARGETS.proteinGrams * 0.7) {
    insights.push(
      createInsight({
        id: "protein-below-target",
        type: "Opportunity",
        title: "Protein intake is below target",
        summary: "Recent protein intake is below 70% of the default demo target.",
        detail: "This target is a simple demo baseline, not personalized nutrition advice.",
        confidence: getConfidence(countRecent(params.nutritionMeals, LOOKBACK_7_DAYS)),
        relatedAreas: ["Nutrition", "Workout"],
        suggestedAction: "Add one protein-focused meal or snack.",
      }),
    );
  }

  return insights;
}

function createInsight(input: Omit<HealthInsight, "createdAt">): HealthInsight {
  return {
    ...input,
    createdAt: getTodayDateKey(),
  };
}

function createWeeklyFocus(
  title: string,
  reason: string,
  suggestedAction: string,
  nextSteps: string[],
): WeeklyHealthFocus {
  return { title, reason, suggestedAction, nextSteps };
}

function countRecent<T extends { date: string }>(items: T[], days: number): number {
  return getRecentItems(items, days).length;
}

function getRecentItems<T extends { date: string }>(items: T[], days: number): T[] {
  const today = new Date(`${getTodayDateKey()}T00:00:00`);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  return items.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);

    return date >= start && date <= today;
  });
}

function getCoveragePoints(count: number): number {
  if (count >= 3) {
    return 20;
  }

  if (count >= 1) {
    return 10;
  }

  return 0;
}

function averageRecentMetric<T extends { date: string }>(
  items: T[],
  days: number,
  selector: (item: T) => number,
): number {
  const values = getRecentItems(items, days)
    .map(selector)
    .filter((value) => value > 0);

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRecentCompletedWorkouts(workoutLogs: WorkoutLog[], days: number): WorkoutLog[] {
  return getRecentItems(workoutLogs, days).filter((log) => log.completed);
}

function getRecentProteinAverage(meals: NutritionMeal[]): number {
  const recentMeals = getRecentItems(meals, LOOKBACK_7_DAYS);

  if (recentMeals.length === 0) {
    return 0;
  }

  const totalsByDate = new Map<string, number>();

  recentMeals.forEach((meal) => {
    const totals = calculateMealTotals(meal);
    totalsByDate.set(meal.date, (totalsByDate.get(meal.date) ?? 0) + totals.proteinGrams);
  });

  const values = Array.from(totalsByDate.values());

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAverageReadiness(params: HealthInsightParams): number {
  const recentCheckIns = getRecentItems(params.recoveryCheckIns, LOOKBACK_7_DAYS);

  if (recentCheckIns.length === 0) {
    return 0;
  }

  const total = recentCheckIns.reduce(
    (sum, checkIn) =>
      sum +
      calculateReadinessScore({
        checkIn,
        workoutLogs: params.workoutLogs,
        healthLogs: params.healthLogs,
      }).score,
    0,
  );

  return total / recentCheckIns.length;
}

function getAverageStress(params: HealthInsightParams): number {
  const recoveryStress = averageRecentMetric(
    params.recoveryCheckIns,
    LOOKBACK_7_DAYS,
    (checkIn) => checkIn.stressLevel,
  );

  if (recoveryStress > 0) {
    return recoveryStress;
  }

  return averageRecentMetric(params.healthLogs, LOOKBACK_7_DAYS, (log) => log.stressLevel);
}

function getSevenDayWeightChange(bodyMetricLogs: BodyMetricLog[]): number {
  const recentLogs = sortBodyMetricLogs(getRecentItems(bodyMetricLogs, LOOKBACK_7_DAYS))
    .filter((log) => log.weightKg > 0)
    .reverse();

  if (recentLogs.length < 2) {
    return 0;
  }

  return recentLogs[recentLogs.length - 1].weightKg - recentLogs[0].weightKg;
}

function getConfidence(logCount: number): HealthInsightConfidence {
  if (logCount >= 5) {
    return "High";
  }

  if (logCount >= 3) {
    return "Medium";
  }

  return "Low";
}

function getInsightPriority(insight: HealthInsight): number {
  const priorities: Record<HealthInsight["type"], number> = {
    Warning: 0,
    Opportunity: 1,
    Pattern: 2,
    Positive: 3,
    Recommendation: 4,
  };

  return priorities[insight.type];
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}
