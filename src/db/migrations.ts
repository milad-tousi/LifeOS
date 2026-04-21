import { Table } from "dexie";

export interface DailyReviewRecord {
  id: string;
  reviewedOn: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export function applyMigrations(): {
  dailyReviews?: Table<DailyReviewRecord, string>;
} {
  return {};
}

