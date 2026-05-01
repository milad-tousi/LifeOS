import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ReviewEntry } from "@/features/reviews/types/review.types";

type HistoryFilter = "all" | "daily" | "weekly";

interface ReviewHistoryProps {
  reviews: ReviewEntry[];
}

export function ReviewHistory({ reviews }: ReviewHistoryProps): JSX.Element {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filteredReviews = useMemo(
    () => reviews.filter((review) => filter === "all" || review.type === filter),
    [filter, reviews],
  );

  return (
    <section className="review-card review-history">
      <div className="review-card__header">
        <div>
          <h2>Review History</h2>
          <p>Browse previous reflections chronologically and reopen the details when needed.</p>
        </div>
        <div className="review-history__filters" aria-label="Review history filter">
          {(["all", "daily", "weekly"] as const).map((option) => (
            <button
              className={`review-history__filter${
                filter === option ? " review-history__filter--active" : ""
              }`}
              key={option}
              onClick={() => setFilter(option)}
              type="button"
            >
              {getFilterLabel(option)}
            </button>
          ))}
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="review-empty-state">
          <strong>No reviews yet</strong>
          <p>Your saved daily and weekly reflections will appear here.</p>
        </div>
      ) : (
        <div className="review-history__list">
          {filteredReviews.map((review) => {
            const isExpanded = expandedId === review.id;

            return (
              <article className="review-history__item" key={review.id}>
                <button
                  className="review-history__summary"
                  onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  type="button"
                >
                  <div>
                    <span>{review.type === "daily" ? "Daily Review" : "Weekly Review"}</span>
                    <strong>{review.periodLabel}</strong>
                  </div>
                  <ChevronDown
                    className={isExpanded ? "review-history__chevron--open" : ""}
                    size={18}
                  />
                </button>

                {isExpanded ? <ReviewHistoryDetails review={review} /> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ReviewHistoryDetails({ review }: { review: ReviewEntry }): JSX.Element {
  if (review.type === "daily") {
    return (
      <div className="review-history__details">
        <HistoryDetail label="What went well" value={review.wentWell} />
        <HistoryDetail label="What did not go well" value={review.didNotGoWell} />
        <HistoryDetail label="Biggest distraction/challenge" value={review.distraction} />
        <HistoryDetail label="Mood" value={`${review.mood}/5`} />
        <HistoryDetail label="Energy" value={`${review.energy}/5`} />
        <HistoryDetail label="Main focus for tomorrow" value={review.tomorrowFocus} />
        {review.notes ? <HistoryDetail label="Additional notes" value={review.notes} /> : null}
      </div>
    );
  }

  return (
    <div className="review-history__details">
      <HistoryDetail label="Biggest achievement" value={review.biggestAchievement} />
      <HistoryDetail label="Main blockers/challenges" value={review.blockers} />
      <HistoryDetail label="Lessons learned" value={review.lessonsLearned} />
      <HistoryDetail label="Focus for next week" value={review.nextWeekFocus} />
      <HistoryDetail label="Weekly self-rating" value={`${review.selfRating}/10`} />
    </div>
  );
}

function HistoryDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="review-history__detail">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function getFilterLabel(filter: HistoryFilter): string {
  switch (filter) {
    case "all":
      return "All";
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
  }
}
