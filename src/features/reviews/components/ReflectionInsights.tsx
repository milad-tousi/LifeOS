import { useMemo, useState } from "react";
import { MonthlyReflectionSummary } from "@/features/reviews/components/MonthlyReflectionSummary";
import { ReviewEnergyTrendChart } from "@/features/reviews/components/ReviewEnergyTrendChart";
import { ReviewMoodTrendChart } from "@/features/reviews/components/ReviewMoodTrendChart";
import { ReviewStatsCards } from "@/features/reviews/components/ReviewStatsCards";
import { ReviewEntry } from "@/features/reviews/types/review.types";
import {
  analyzeReviewPatterns,
  ReviewTrendRange,
} from "@/features/reviews/utils/analyzeReviewPatterns";

interface ReflectionInsightsProps {
  reviews: ReviewEntry[];
}

const rangeOptions: Array<{ label: string; value: ReviewTrendRange }> = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export function ReflectionInsights({ reviews }: ReflectionInsightsProps): JSX.Element {
  const [range, setRange] = useState<ReviewTrendRange>("30d");
  const analysis = useMemo(() => analyzeReviewPatterns(reviews), [reviews]);
  const hasDailyReviews = reviews.some((review) => review.type === "daily");

  return (
    <section className="reflection-insights">
      <div className="reflection-insights__header">
        <div>
          <span>Analytics</span>
          <h2>Reflection Insights</h2>
          <p>Patterns from your real review history, with no generated sample data.</p>
        </div>
        <div className="reflection-insights__range" aria-label="Reflection chart range">
          {rangeOptions.map((option) => (
            <button
              className={`reflection-insights__range-item${
                range === option.value ? " reflection-insights__range-item--active" : ""
              }`}
              key={option.value}
              onClick={() => setRange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!hasDailyReviews ? (
        <div className="review-empty-state reflection-insights__onboarding">
          <strong>Start with a few daily reviews</strong>
          <p>
            Mood trends, energy trends, weekday patterns, and blocker analysis appear after
            you save daily reflections.
          </p>
        </div>
      ) : null}

      <ReviewStatsCards analysis={analysis} />

      <div className="reflection-insights__chart-grid">
        <ReviewMoodTrendChart range={range} reviews={reviews} />
        <ReviewEnergyTrendChart range={range} reviews={reviews} />
      </div>

      <div className="reflection-insights__lower-grid">
        <section className="review-card reflection-insight-cards">
          <div className="review-card__header">
            <div>
              <h2>Pattern Analysis</h2>
              <p>Signals detected from mood, energy, distractions, and blockers.</p>
            </div>
          </div>

          {analysis.insights.length > 0 ? (
            <div className="reflection-insight-cards__grid">
              {analysis.insights.map((insight) => (
                <article
                  className={`reflection-insight-card reflection-insight-card--${insight.tone}`}
                  key={insight.id}
                >
                  <span>{insight.title}</span>
                  <p>{insight.detail}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="review-empty-state review-empty-state--compact">
              <strong>No patterns yet</strong>
              <p>Save more daily and weekly reviews to unlock pattern cards.</p>
            </div>
          )}
        </section>

        <MonthlyReflectionSummary analysis={analysis} />
      </div>
    </section>
  );
}
