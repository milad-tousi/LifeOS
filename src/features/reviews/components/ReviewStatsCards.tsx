import { BarChart3, BatteryCharging, CalendarCheck2, Flame, Smile, TrendingUp } from "lucide-react";
import { ReviewPatternAnalysis } from "@/features/reviews/utils/analyzeReviewPatterns";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/i18n/formatters";

interface ReviewStatsCardsProps {
  analysis: ReviewPatternAnalysis;
}

export function ReviewStatsCards({ analysis }: ReviewStatsCardsProps): JSX.Element {
  const { language, t } = useI18n();
  const cards = [
    {
      icon: Flame,
      label: t("reviews.metrics.dailyStreak"),
      value: t("reviews.metrics.dailyStreakValue", {
        count: formatNumber(analysis.dailyReviewStreak, language),
      }),
      detail: t("reviews.metrics.dailyStreakSubtitle"),
      tone: "orange",
    },
    {
      icon: CalendarCheck2,
      label: t("reviews.metrics.weeklyStreak"),
      value: t("reviews.metrics.weeklyStreakValue", {
        count: formatNumber(analysis.weeklyReviewStreak, language),
      }),
      detail: t("reviews.metrics.weeklyStreakSubtitle"),
      tone: "blue",
    },
    {
      icon: Smile,
      label: t("reviews.metrics.averageMood"),
      value: formatScore(analysis.averageMood, language, t),
      detail: t("reviews.metrics.averageMoodSubtitle"),
      tone: "violet",
    },
    {
      icon: BatteryCharging,
      label: t("reviews.metrics.averageEnergy"),
      value: formatScore(analysis.averageEnergy, language, t),
      detail: t("reviews.metrics.averageEnergySubtitle"),
      tone: "green",
    },
    {
      icon: BarChart3,
      label: t("reviews.metrics.reviewsThisMonth"),
      value: formatNumber(analysis.reviewsCompletedThisMonth, language),
      detail: t("reviews.metrics.reviewsThisMonthSubtitle"),
      tone: "blue",
    },
    {
      icon: TrendingUp,
      label: t("reviews.metrics.moodDirection"),
      value: formatTrend(analysis.averageMoodTrendDirection, t),
      detail: t("reviews.metrics.moodDirectionSubtitle"),
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

function formatScore(
  value: number | null,
  language: "en" | "fa",
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  return value === null ? t("reviews.empty.noData") : `${formatNumber(value, language)}/5`;
}

function formatTrend(
  value: ReviewPatternAnalysis["averageMoodTrendDirection"],
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  switch (value) {
    case "up":
      return t("reviews.trend.up");
    case "down":
      return t("reviews.trend.down");
    case "flat":
      return t("reviews.trend.flat");
    case "insufficient-data":
      return t("reviews.empty.noTrend");
  }
}
