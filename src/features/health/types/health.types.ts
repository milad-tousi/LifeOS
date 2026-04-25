export type HealthMetricType =
  | "sleep"
  | "water"
  | "workout"
  | "energy"
  | "stress"
  | "weight";

export type HealthLevel = "good" | "ok" | "low";

export type HealthRating = 1 | 2 | 3 | 4 | 5;

export interface HealthLog {
  id: string;
  date: string;
  weightKg: number;
  sleepHours: number;
  waterLiters: number;
  workoutMinutes: number;
  workoutCompleted: boolean;
  calories: number;
  proteinGrams: number;
  energyLevel: HealthRating;
  stressLevel: HealthRating;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type HealthLogInput = Omit<HealthLog, "id" | "date" | "createdAt" | "updatedAt">;

export interface HealthMetricStatus {
  status: string;
  helper: string;
  level: HealthLevel;
}

export interface HealthScoreBreakdown {
  total: number;
  sleep: number;
  water: number;
  workout: number;
  energy: number;
  stress: number;
  details: {
    sleep: HealthMetricStatus;
    water: HealthMetricStatus;
    workout: HealthMetricStatus;
    energy: HealthMetricStatus;
    stress: HealthMetricStatus;
  };
}

export interface HealthOverviewStats {
  todayLog: HealthLog | null;
  todayScore: HealthScoreBreakdown | null;
  latestWeightKg: number | null;
  averageSleepHours: number;
  averageWaterLiters: number;
  workoutDaysLast7: number;
  logCount: number;
}

export interface BodyMetricLog {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  waistCm: number;
  chestCm: number;
  armCm: number;
  legCm: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type BodyMetricLogInput = Omit<
  BodyMetricLog,
  "id" | "date" | "createdAt" | "updatedAt"
>;

export interface BodyMetricOverviewStats {
  latestWeightKg: number | null;
  latestHeightCm: number | null;
  latestBmi: number | null;
  latestBmiStatus: string;
  latestBodyFatPercent: number | null;
  latestMuscleMassKg: number | null;
  latestWaistCm: number | null;
  weightChangeFromPrevious: number | null;
  bodyFatChangeFromPrevious: number | null;
  waistChangeFromPrevious: number | null;
  totalEntries: number;
}

export interface BodyMetricTrendPoint {
  id: string;
  date: string;
  weightKg: number | null;
  bmi: number | null;
  bodyFatPercent: number | null;
  waistCm: number | null;
}

export type WorkoutType =
  | "Strength"
  | "Cardio"
  | "Mobility"
  | "Stretching"
  | "Mixed"
  | "Custom";

export type WorkoutIntensity = "Low" | "Medium" | "High";

export type ExerciseDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  targetMuscles: string;
  equipment: string;
  sets: number;
  reps: number;
  weightKg: number;
  durationMinutes: number;
  notes: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  title: string;
  workoutType: WorkoutType;
  intensity: WorkoutIntensity;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  completed: boolean;
  caloriesBurned: number;
  perceivedEffort: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkoutLogInput = Omit<WorkoutLog, "id" | "createdAt" | "updatedAt">;

export interface ExerciseLibraryItem {
  id: string;
  name: string;
  category: WorkoutType;
  targetMuscles: string;
  equipment: string;
  difficulty: ExerciseDifficulty;
  defaultSets: number;
  defaultReps: number;
  defaultDurationMinutes: number;
}

export interface WorkoutOverviewStats {
  todayWorkout: WorkoutLog | null;
  weeklyWorkoutMinutes: number;
  weeklyWorkoutCount: number;
  workoutStreak: number;
  totalCompletedWorkouts: number;
  latestWorkout: WorkoutLog | null;
  averageEffort: number;
}

export type NutritionMealType =
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Snack"
  | "Pre-workout"
  | "Post-workout"
  | "Custom";

export interface NutritionFoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
}

export interface NutritionMeal {
  id: string;
  date: string;
  mealType: NutritionMealType;
  title: string;
  items: NutritionFoodItem[];
  waterLiters: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type NutritionMealInput = Omit<NutritionMeal, "id" | "createdAt" | "updatedAt">;

export interface MealTemplate {
  id: string;
  title: string;
  mealType: NutritionMealType;
  items: NutritionFoodItem[];
  waterLiters: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type MealTemplateInput = Omit<MealTemplate, "id" | "createdAt" | "updatedAt">;

export interface NutritionMealTotals {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
  waterLiters: number;
}

export interface NutritionOverviewStats {
  todayCalories: number;
  todayProteinGrams: number;
  todayCarbsGrams: number;
  todayFatGrams: number;
  todayWaterLiters: number;
  todayMealCount: number;
  proteinTargetProgress: number;
  calorieTargetProgress: number;
  latestMeal: NutritionMeal | null;
  totalTemplates: number;
}

export type RecoveryRating = 1 | 2 | 3 | 4 | 5;

export type RestingFeeling = "Fresh" | "Normal" | "Tired" | "Exhausted";

export type ReadinessStatus = "Excellent" | "Good" | "Moderate" | "Low";

export type SuggestedActivity =
  | "Heavy Training"
  | "Normal Training"
  | "Light Cardio"
  | "Mobility"
  | "Rest Day";

export interface RecoveryCheckIn {
  id: string;
  date: string;
  sleepQuality: RecoveryRating;
  sorenessLevel: RecoveryRating;
  moodLevel: RecoveryRating;
  energyLevel: RecoveryRating;
  stressLevel: RecoveryRating;
  restingFeeling: RestingFeeling;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type RecoveryCheckInInput = Omit<
  RecoveryCheckIn,
  "id" | "createdAt" | "updatedAt"
>;

export interface ReadinessBreakdown {
  sleepScore: number;
  stressScore: number;
  energyScore: number;
  sorenessScore: number;
  workoutLoadScore: number;
  moodScore: number;
}

export interface ReadinessResult {
  score: number;
  status: ReadinessStatus;
  recommendationTitle: string;
  recommendationText: string;
  suggestedActivity: SuggestedActivity;
  warnings: string[];
  breakdown: ReadinessBreakdown;
}

export interface RecoveryOverviewStats {
  todayCheckIn: RecoveryCheckIn | null;
  readiness: ReadinessResult | null;
  averageReadiness7Days: number;
  recoveryStreak: number;
  latestWarning: string | null;
  suggestedActivity: SuggestedActivity | null;
}

export type HealthInsightType =
  | "Positive"
  | "Warning"
  | "Opportunity"
  | "Pattern"
  | "Recommendation";

export type HealthInsightArea =
  | "Sleep"
  | "Workout"
  | "Nutrition"
  | "Recovery"
  | "Hydration"
  | "Stress"
  | "Energy"
  | "Body Metrics";

export type HealthInsightConfidence = "Low" | "Medium" | "High";

export interface HealthInsight {
  id: string;
  type: HealthInsightType;
  title: string;
  summary: string;
  detail: string;
  confidence: HealthInsightConfidence;
  relatedAreas: HealthInsightArea[];
  suggestedAction: string;
  createdAt: string;
}

export interface HealthInsightOverviewStats {
  totalInsights: number;
  positivePatterns: number;
  warningPatterns: number;
  opportunityCount: number;
  bestPattern: string;
  weeklyFocus: string;
  dataCoverageScore: number;
}

export interface HealthDataCoverage {
  healthLogsCount: number;
  bodyMetricsCount: number;
  workoutLogsCount: number;
  nutritionMealsCount: number;
  recoveryCheckInsCount: number;
  coverageScore: number;
  missingAreas: string[];
}

export interface WeeklyHealthFocus {
  title: string;
  reason: string;
  suggestedAction: string;
  nextSteps: string[];
}
