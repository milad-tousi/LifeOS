import { ReviewPatternAnalysis } from "@/features/reviews/utils/analyzeReviewPatterns";

interface MonthlyReflectionSummaryProps {
  analysis: ReviewPatternAnalysis;
}

export function MonthlyReflectionSummary({
  analysis,
}: MonthlyReflectionSummaryProps): JSX.Element {
  const summary = analysis.monthlySummary;
  const items = [
    { label: "Reviews completed", value: String(summary.reviewsCompleted) },
    { label: "Avg mood", value: formatScore(summary.averageMood) },
    { label: "Avg energy", value: formatScore(summary.averageEnergy) },
    { label: "Most common blocker", value: summary.mostCommonBlocker ?? "Not enough data" },
    { label: "Best performing week", value: summary.bestPerformingWeek ?? "Not enough data" },
  ];

  return (
    <section className="review-card monthly-reflection-summary">
      <div className="review-card__header">
        <div>
          <h2>Monthly Summary</h2>
          <p>A compact readout of this month’s reflection signals.</p>
        </div>
      </div>
      <div className="monthly-reflection-summary__grid">
        {items.map((item) => (
          <div className="monthly-reflection-summary__item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatScore(value: number | null): string {
  return value === null ? "Not enough data" : `${value.toFixed(1)}/5`;
}
