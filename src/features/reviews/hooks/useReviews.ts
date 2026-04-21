import { useLiveQuery } from "dexie-react-hooks";
import { DailyReview, db } from "@/db/dexie";

export interface UseReviewsResult {
  reviews: DailyReview[];
  loading: boolean;
}

export function useReviews(): UseReviewsResult {
  const reviews = useLiveQuery(() => db.dailyReviews.orderBy("date").reverse().toArray(), []);

  return {
    reviews: reviews ?? [],
    loading: reviews === undefined,
  };
}
