import {
  DailyReview,
  ReviewEntry,
  WeeklyReview,
} from "@/features/reviews/types/review.types";

export type ReviewTrendRange = "7d" | "30d" | "90d";
export type ReviewTrendDirection = "up" | "down" | "flat" | "insufficient-data";

export interface ReviewTrendPoint {
  date: string;
  label: string;
  mood: number;
  energy: number;
}

export interface ReflectionInsightItem {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
}

export interface MonthlyReflectionSummaryData {
  averageEnergy: number | null;
  averageMood: number | null;
  bestPerformingWeek: string | null;
  mostCommonBlocker: string | null;
  reviewsCompleted: number;
}

export interface ReviewPatternAnalysis {
  averageEnergy: number | null;
  averageEnergyTrendDirection: ReviewTrendDirection;
  averageMood: number | null;
  averageMoodTrendDirection: ReviewTrendDirection;
  bestEnergyDayOfWeek: string | null;
  bestMoodDayOfWeek: string | null;
  dailyReviewStreak: number;
  insights: ReflectionInsightItem[];
  monthlySummary: MonthlyReflectionSummaryData;
  mostCommonDistraction: string | null;
  mostConsistentReviewDayType: "weekdays" | "weekends" | "balanced" | "insufficient-data";
  mostFrequentBlockerKeyword: string | null;
  reviewsCompletedThisMonth: number;
  weeklyReviewStreak: number;
  worstMoodDayOfWeek: string | null;
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "because",
  "been",
  "but",
  "could",
  "did",
  "didnt",
  "does",
  "dont",
  "from",
  "had",
  "has",
  "have",
  "into",
  "just",
  "main",
  "more",
  "not",
  "that",
  "the",
  "then",
  "this",
  "was",
  "were",
  "with",
  "work",
  "would",
]);

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function analyzeReviewPatterns(
  reviews: ReviewEntry[],
  now = new Date(),
): ReviewPatternAnalysis {
  const dailyReviews = getDailyReviews(reviews);
  const weeklyReviews = getWeeklyReviews(reviews);
  const monthDailyReviews = filterDailyReviewsByRange(dailyReviews, startOfMonth(now), endOfMonth(now));
  const monthReviews = reviews.filter((review) =>
    isDateKeyInRange(getReviewCreatedDateKey(review), startOfMonth(now), endOfMonth(now)),
  );
  const averageMood = average(dailyReviews.map((review) => review.mood));
  const averageEnergy = average(dailyReviews.map((review) => review.energy));
  const moodTrend = calculateTrendDirection(dailyReviews.map((review) => review.mood));
  const energyTrend = calculateTrendDirection(dailyReviews.map((review) => review.energy));
  const mostCommonBlocker =
    getTopKeyword([
      ...dailyReviews.map((review) => review.distraction),
      ...weeklyReviews.map((review) => review.blockers),
    ]) ?? null;
  const monthlySummary = calculateMonthlySummary(monthDailyReviews, weeklyReviews, now);

  const analysis: ReviewPatternAnalysis = {
    averageEnergy,
    averageEnergyTrendDirection: energyTrend,
    averageMood,
    averageMoodTrendDirection: moodTrend,
    bestEnergyDayOfWeek: getBestDayOfWeek(dailyReviews, "energy", "best"),
    bestMoodDayOfWeek: getBestDayOfWeek(dailyReviews, "mood", "best"),
    dailyReviewStreak: calculateDailyReviewStreak(dailyReviews, now),
    insights: [],
    monthlySummary: {
      ...monthlySummary,
      mostCommonBlocker,
      reviewsCompleted: monthReviews.length,
    },
    mostCommonDistraction: getMostCommonText(dailyReviews.map((review) => review.distraction)),
    mostConsistentReviewDayType: getConsistentReviewDayType(dailyReviews),
    mostFrequentBlockerKeyword: mostCommonBlocker,
    reviewsCompletedThisMonth: monthReviews.length,
    weeklyReviewStreak: calculateWeeklyReviewStreak(weeklyReviews, now),
    worstMoodDayOfWeek: getBestDayOfWeek(dailyReviews, "mood", "worst"),
  };

  return {
    ...analysis,
    insights: generateInsights(analysis),
  };
}

export function getReviewTrendPoints(
  reviews: ReviewEntry[],
  range: ReviewTrendRange,
  now = new Date(),
): ReviewTrendPoint[] {
  const startDate = addDays(startOfDay(now), -(getRangeDayCount(range) - 1));

  return getDailyReviews(reviews)
    .filter((review) => isDateKeyInRange(review.date, startDate, now))
    .map((review) => {
      const date = parseDateKey(review.date) ?? now;

      return {
        date: review.date,
        label: formatTrendLabel(date, range),
        mood: review.mood,
        energy: review.energy,
      };
    });
}

function generateInsights(analysis: ReviewPatternAnalysis): ReflectionInsightItem[] {
  const insights: ReflectionInsightItem[] = [];

  if (analysis.mostCommonDistraction) {
    insights.push({
      id: "common-distraction",
      title: "Most common distraction",
      detail: `Most common distraction this month: ${analysis.mostCommonDistraction}.`,
      tone: "neutral",
    });
  }

  if (analysis.averageMoodTrendDirection !== "insufficient-data") {
    insights.push({
      id: "mood-trend",
      title: "Mood direction",
      detail: getTrendInsightDetail("mood", analysis.averageMoodTrendDirection),
      tone: analysis.averageMoodTrendDirection === "up" ? "positive" : analysis.averageMoodTrendDirection === "down" ? "warning" : "neutral",
    });
  }

  if (analysis.bestEnergyDayOfWeek) {
    insights.push({
      id: "best-energy-day",
      title: "Best energy day",
      detail: `${analysis.bestEnergyDayOfWeek}s have your highest average energy.`,
      tone: "positive",
    });
  }

  if (analysis.bestMoodDayOfWeek && analysis.worstMoodDayOfWeek) {
    insights.push({
      id: "mood-weekday-pattern",
      title: "Mood weekday pattern",
      detail: `${analysis.bestMoodDayOfWeek}s currently score highest for mood; ${analysis.worstMoodDayOfWeek}s score lowest.`,
      tone: "neutral",
    });
  }

  if (analysis.mostFrequentBlockerKeyword) {
    insights.push({
      id: "common-blocker",
      title: "Common blocker",
      detail: `Most frequent blocker keyword: ${analysis.mostFrequentBlockerKeyword}.`,
      tone: "warning",
    });
  }

  if (analysis.mostConsistentReviewDayType !== "insufficient-data") {
    insights.push({
      id: "review-consistency",
      title: "Review consistency",
      detail: getConsistencyInsightDetail(analysis.mostConsistentReviewDayType),
      tone: "positive",
    });
  }

  return insights;
}

function calculateMonthlySummary(
  dailyReviews: DailyReview[],
  weeklyReviews: WeeklyReview[],
  now: Date,
): MonthlyReflectionSummaryData {
  return {
    averageEnergy: average(dailyReviews.map((review) => review.energy)),
    averageMood: average(dailyReviews.map((review) => review.mood)),
    bestPerformingWeek: getBestPerformingWeek(dailyReviews),
    mostCommonBlocker: getTopKeyword([
      ...dailyReviews.map((review) => review.distraction),
      ...weeklyReviews
        .filter((review) => isDateKeyInRange(review.weekStart, startOfMonth(now), endOfMonth(now)))
        .map((review) => review.blockers),
    ]) ?? null,
    reviewsCompleted: 0,
  };
}

function calculateDailyReviewStreak(reviews: DailyReview[], now: Date): number {
  const reviewDates = new Set(reviews.map((review) => review.date));
  let streak = 0;
  let cursor = startOfDay(now);

  while (reviewDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function calculateWeeklyReviewStreak(reviews: WeeklyReview[], now: Date): number {
  const reviewWeeks = new Set(reviews.map((review) => review.periodKey));
  let streak = 0;
  let cursor = startOfWeek(now);

  while (reviewWeeks.has(`week-${toDateKey(cursor)}`)) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }

  return streak;
}

function calculateTrendDirection(values: number[]): ReviewTrendDirection {
  if (values.length < 4) {
    return "insufficient-data";
  }

  const midpoint = Math.floor(values.length / 2);
  const firstAverage = average(values.slice(0, midpoint));
  const secondAverage = average(values.slice(midpoint));

  if (firstAverage === null || secondAverage === null) {
    return "insufficient-data";
  }

  const difference = secondAverage - firstAverage;

  if (Math.abs(difference) < 0.15) {
    return "flat";
  }

  return difference > 0 ? "up" : "down";
}

function getBestDayOfWeek(
  reviews: DailyReview[],
  field: "mood" | "energy",
  direction: "best" | "worst",
): string | null {
  const byDay = new Map<number, number[]>();

  reviews.forEach((review) => {
    const date = parseDateKey(review.date);
    if (!date) {
      return;
    }

    const values = byDay.get(date.getDay()) ?? [];
    values.push(review[field]);
    byDay.set(date.getDay(), values);
  });

  const averages = Array.from(byDay.entries()).map(([day, values]) => ({
    day,
    value: average(values) ?? 0,
  }));

  if (averages.length === 0) {
    return null;
  }

  const sorted = averages.sort((left, right) =>
    direction === "best" ? right.value - left.value : left.value - right.value,
  );

  return WEEKDAY_LABELS[sorted[0].day];
}

function getBestPerformingWeek(reviews: DailyReview[]): string | null {
  const byWeek = new Map<string, { label: string; values: number[] }>();

  reviews.forEach((review) => {
    const date = parseDateKey(review.date);

    if (!date) {
      return;
    }

    const weekStart = startOfWeek(date);
    const key = toDateKey(weekStart);
    const current = byWeek.get(key) ?? {
      label: `${formatShortDate(weekStart)} - ${formatShortDate(addDays(weekStart, 6))}`,
      values: [],
    };
    current.values.push((review.mood + review.energy) / 2);
    byWeek.set(key, current);
  });

  const bestWeek = Array.from(byWeek.values())
    .map((week) => ({ label: week.label, score: average(week.values) ?? 0 }))
    .sort((left, right) => right.score - left.score)[0];

  return bestWeek?.label ?? null;
}

function getConsistentReviewDayType(reviews: DailyReview[]): ReviewPatternAnalysis["mostConsistentReviewDayType"] {
  if (reviews.length < 3) {
    return "insufficient-data";
  }

  const weekdayCount = reviews.filter((review) => {
    const date = parseDateKey(review.date);
    return date ? date.getDay() >= 1 && date.getDay() <= 5 : false;
  }).length;
  const weekendCount = reviews.length - weekdayCount;

  if (Math.abs(weekdayCount - weekendCount) <= 1) {
    return "balanced";
  }

  return weekdayCount > weekendCount ? "weekdays" : "weekends";
}

function getMostCommonText(values: string[]): string | null {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  const [topValue] = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? [];

  return topValue ? toTitleCase(topValue) : null;
}

function getTopKeyword(values: string[]): string | null {
  const counts = new Map<string, number>();

  values.flatMap(tokenizeText).forEach((word) => {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  });

  const [topValue] = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? [];

  return topValue ? toTitleCase(topValue) : null;
}

function tokenizeText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function filterDailyReviewsByRange(reviews: DailyReview[], start: Date, end: Date): DailyReview[] {
  return reviews.filter((review) => isDateKeyInRange(review.date, start, end));
}

function getDailyReviews(reviews: ReviewEntry[]): DailyReview[] {
  return reviews
    .filter((review): review is DailyReview => review.type === "daily")
    .sort((left, right) => left.date.localeCompare(right.date));
}

function getWeeklyReviews(reviews: ReviewEntry[]): WeeklyReview[] {
  return reviews
    .filter((review): review is WeeklyReview => review.type === "weekly")
    .sort((left, right) => left.weekStart.localeCompare(right.weekStart));
}

function getTrendInsightDetail(label: "mood" | "energy", direction: ReviewTrendDirection): string {
  switch (direction) {
    case "up":
      return `Your average ${label} is trending up across recent reviews.`;
    case "down":
      return `Your average ${label} is trending down across recent reviews.`;
    case "flat":
      return `Your average ${label} is stable across recent reviews.`;
    case "insufficient-data":
      return `Add more daily reviews to detect your ${label} trend.`;
  }
}

function getConsistencyInsightDetail(type: ReviewPatternAnalysis["mostConsistentReviewDayType"]): string {
  switch (type) {
    case "weekdays":
      return "You complete reviews most consistently on weekdays.";
    case "weekends":
      return "You complete reviews most consistently on weekends.";
    case "balanced":
      return "Your review consistency is balanced across weekdays and weekends.";
    case "insufficient-data":
      return "Add more reviews to detect consistency patterns.";
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getRangeDayCount(range: ReviewTrendRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
  }
}

function isDateKeyInRange(dateKey: string, start: Date, end: Date): boolean {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  return dateKey >= startKey && dateKey <= endKey;
}

function getReviewCreatedDateKey(review: ReviewEntry): string {
  return review.createdAt.slice(0, 10);
}

function parseDateKey(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + 1);
  return start;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTrendLabel(date: Date, range: ReviewTrendRange): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: range === "90d" ? "short" : undefined,
    weekday: range === "7d" ? "short" : undefined,
  }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date);
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
