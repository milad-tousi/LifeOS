import { createId } from "@/lib/id";
import {
  DailyReview,
  DailyReviewInput,
  ReviewEntry,
  WeeklyReview,
  WeeklyReviewInput,
} from "@/features/reviews/types/review.types";

const REVIEW_STORAGE_KEY = "lifeos.reviews.entries";

export interface ReviewPeriodRange {
  end: Date;
  key: string;
  label: string;
  start: Date;
}

export function getReviews(): ReviewEntry[] {
  return loadReviews().sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function createDailyReview(input: DailyReviewInput, date = new Date()): DailyReview {
  const reviews = loadReviews();
  const dateKey = toDateKey(date);

  if (reviews.some((review) => review.type === "daily" && review.periodKey === dateKey)) {
    throw new Error("Daily review already exists for today.");
  }

  const timestamp = new Date().toISOString();
  const review: DailyReview = {
    id: createId(),
    type: "daily",
    periodKey: dateKey,
    periodLabel: formatLongDate(date),
    date: dateKey,
    wentWell: input.wentWell.trim(),
    didNotGoWell: input.didNotGoWell.trim(),
    distraction: input.distraction.trim(),
    mood: input.mood,
    energy: input.energy,
    tomorrowFocus: input.tomorrowFocus.trim(),
    notes: input.notes?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveReviews([review, ...reviews]);
  return review;
}

export function createWeeklyReview(input: WeeklyReviewInput, date = new Date()): WeeklyReview {
  const reviews = loadReviews();
  const week = getWeekRange(date);

  if (reviews.some((review) => review.type === "weekly" && review.periodKey === week.key)) {
    throw new Error("Weekly review already exists for this week.");
  }

  const timestamp = new Date().toISOString();
  const review: WeeklyReview = {
    id: createId(),
    type: "weekly",
    periodKey: week.key,
    periodLabel: week.label,
    weekStart: toDateKey(week.start),
    weekEnd: toDateKey(week.end),
    biggestAchievement: input.biggestAchievement.trim(),
    blockers: input.blockers.trim(),
    lessonsLearned: input.lessonsLearned.trim(),
    nextWeekFocus: input.nextWeekFocus.trim(),
    selfRating: input.selfRating,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveReviews([review, ...reviews]);
  return review;
}

export function hasDailyReviewForDate(date = new Date()): boolean {
  const dateKey = toDateKey(date);
  return loadReviews().some((review) => review.type === "daily" && review.periodKey === dateKey);
}

export function hasWeeklyReviewForDate(date = new Date()): boolean {
  const weekKey = getWeekRange(date).key;
  return loadReviews().some((review) => review.type === "weekly" && review.periodKey === weekKey);
}

export function getDayRange(date = new Date()): ReviewPeriodRange {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
    key: toDateKey(date),
    label: formatLongDate(date),
  };
}

export function getMonthRange(date = new Date()): ReviewPeriodRange {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: startOfDay(start),
    end: endOfDay(end),
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date),
  };
}

export function getWeekRange(date = new Date()): ReviewPeriodRange {
  const start = startOfDay(date);
  const day = start.getDay() === 0 ? 7 : start.getDay();
  start.setDate(start.getDate() - day + 1);
  const end = endOfDay(addDays(start, 6));

  return {
    start,
    end,
    key: `week-${toDateKey(start)}`,
    label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
  };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadReviews(): ReviewEntry[] {
  if (!canUseStorage()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(REVIEW_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? parsedValue.filter(isReviewEntry) : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews: ReviewEntry[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
}

function isReviewEntry(value: unknown): value is ReviewEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReviewEntry>;

  return (
    (candidate.type === "daily" || candidate.type === "weekly") &&
    typeof candidate.id === "string" &&
    typeof candidate.periodKey === "string" &&
    typeof candidate.periodLabel === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date);
}
