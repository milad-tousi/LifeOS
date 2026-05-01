import { BarChart3, BatteryCharging, CalendarCheck2, Flame, Smile, TrendingUp } from "lucide-react";
import { ReviewPatternAnalysis } from "@/features/reviews/utils/analyzeReviewPatterns";

interface ReviewStatsCardsProps {
  analysis: ReviewPatternAnalysis;
}

export function ReviewStatsCards({ analysis }: ReviewStatsCardsProps): JSX.Element {
  const cards = [
    {
      icon: Flame,
      label: "Daily Review Streak",
      value: `${analysis.dailyReviewStreak}d`,
      detail: "Consecutive daily reviews",
      tone: "orange",
    },
    {
      icon: CalendarCheck2,
      label: "Weekly Review Streak",
      value: `${analysis.weeklyReviewStreak}w`,
      detail: "Consecutive weekly reviews",
      tone: "blue",
    },
    {
      icon: Smile,
      label: "Average Mood",
      value: formatScore(analysis.averageMood),
      detail: "Across daily reviews",
      tone: "violet",
    },
    {
      icon: BatteryCharging,
      label: "Average Energy",
      value: formatScore(analysis.averageEnergy),
      detail: "Across daily reviews",
      tone: "green",
    },
    {
      icon: BarChart3,
      label: "Reviews This Month",
      value: String(analysis.reviewsCompletedThisMonth),
      detail: "Daily and weekly entries",
      tone: "blue",
    },
    {
      icon: TrendingUp,
      label: "Mood Direction",
      value: formatTrend(analysis.averageMoodTrendDirection),
      detail: "Recent review trend",
      tone: analysis.averageMoodTrendDirection === "up" ? "green" : analysis.averageMoodTrendDirection === "down" ? "red" : "blue",
    },
  ] as const;

  return (
    <div className="review-stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article className={`review-stat-card review-stat-card--${card.tone}`} key={card.label}>
            <div className="review-stat-card__icon">
              <Icon size={18} />
            </div>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatScore(value: number | null): string {
  return value === null ? "No data" : `${value.toFixed(1)}/5`;
}

function formatTrend(value: ReviewPatternAnalysis["averageMoodTrendDirection"]): string {
  switch (value) {
    case "up":
      return "Improving";
    case "down":
      return "Declining";
    case "flat":
      return "Stable";
    case "insufficient-data":
      return "No trend";
  }
}
