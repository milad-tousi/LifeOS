import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { DailyReview } from "@/db/dexie";

interface DailyReviewCardProps {
  reviews: DailyReview[];
}

export function DailyReviewCard({ reviews }: DailyReviewCardProps): JSX.Element {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No daily reviews yet"
        description="Review entries will be stored locally in a later iteration."
      />
    );
  }

  return (
    <Card title="Daily reviews">
      <div className="page-list">
        {reviews.map((review) => (
          <div key={review.id} className="page-list__item">
            <strong>{review.date}</strong>
            <span className="text-muted">{review.summary ?? "No summary"}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
