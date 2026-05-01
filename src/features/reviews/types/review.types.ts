export type ReviewType = "daily" | "weekly" | "monthly";

export type ReviewMoodScore = 1 | 2 | 3 | 4 | 5;
export type ReviewEnergyScore = 1 | 2 | 3 | 4 | 5;
export type WeeklySelfRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ReviewBase {
  id: string;
  type: Exclude<ReviewType, "monthly">;
  periodKey: string;
  periodLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReview extends ReviewBase {
  type: "daily";
  date: string;
  wentWell: string;
  didNotGoWell: string;
  distraction: string;
  mood: ReviewMoodScore;
  energy: ReviewEnergyScore;
  tomorrowFocus: string;
  notes?: string;
}

export interface WeeklyReview extends ReviewBase {
  type: "weekly";
  weekStart: string;
  weekEnd: string;
  biggestAchievement: string;
  blockers: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  selfRating: WeeklySelfRating;
}

export type ReviewEntry = DailyReview | WeeklyReview;

export interface DailyReviewInput {
  wentWell: string;
  didNotGoWell: string;
  distraction: string;
  mood: ReviewMoodScore;
  energy: ReviewEnergyScore;
  tomorrowFocus: string;
  notes?: string;
}

export interface WeeklyReviewInput {
  biggestAchievement: string;
  blockers: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  selfRating: WeeklySelfRating;
}
