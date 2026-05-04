import { useMemo, useState } from "react";
import { MonthlyReflectionSummary } from "@/features/reviews/components/MonthlyReflectionSummary";
import { ReviewEnergyTrendChart } from "@/features/reviews/components/ReviewEnergyTrendChart";
import { ReviewMoodTrendChart } from "@/features/reviews/components/ReviewMoodTrendChart";
import { ReviewStatsCards } from "@/features/reviews/components/ReviewStatsCards";
import { ReviewEntry } from "@/features/reviews/types/review.types";
import {
  ReviewPatternAnalysis,
  ReviewTrendRange,
  analyzeReviewPatterns,
} from "@/features/reviews/utils/analyzeReviewPatterns";
import { useI18n } from "@/i18n";

interface ReflectionInsightsProps {
  reviews: ReviewEntry[];
}

interface InsightCard {
  detail: string;
  id: string;
  title: string;
  tone: "positive" | "warning" | "neutral";
}

const rangeOptions: Array<{ labelKey: string; value: ReviewTrendRange }> = [
  { labelKey: "reviews.analytics.range7d", value: "7d" },
  { labelKey: "reviews.analytics.range30d", value: "30d" },
  { labelKey: "reviews.analytics.range90d", value: "90d" },
];

export function ReflectionInsights({ reviews }: ReflectionInsightsProps): JSX.Element {
  const { language, t } = useI18n();
  const [range, setRange] = useState<ReviewTrendRange>("30d");
  const analysis = useMemo(() => analyzeReviewPatterns(reviews), [reviews]);
  const hasDailyReviews = reviews.some((review) => review.type === "daily");
  const insightCards = useMemo(
    () => buildInsightCards(analysis, language, t),
    [analysis, language, t],
  );

  return (
    <section className="reflection-insights">
      <div className="reflection-insights__header">
        <div>
          <span>{t("reviews.analytics.badge")}</span>
          <h2>{t("reviews.analytics.title")}</h2>
          <p>{t("reviews.analytics.subtitle")}</p>
        </div>
        <div className="reflection-insights__range" aria-label={t("reviews.analytics.rangeLabel")}>
          {rangeOptions.map((option) => (
            <button
              className={`reflection-insights__range-item${
                range === option.value ? " reflection-insights__range-item--active" : ""
              }`}
              key={option.value}
              onClick={() => setRange(option.value)}
              type="button"
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {!hasDailyReviews ? (
        <div className="review-empty-state reflection-insights__onboarding">
          <strong>{t("reviews.analytics.onboardingTitle")}</strong>
          <p>{t("reviews.analytics.onboardingSubtitle")}</p>
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
              <h2>{t("reviews.patterns.title")}</h2>
              <p>{t("reviews.patterns.subtitle")}</p>
            </div>
          </div>

          {insightCards.length > 0 ? (
            <div className="reflection-insight-cards__grid">
              {insightCards.map((insight) => (
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
              <strong>{t("reviews.patterns.emptyTitle")}</strong>
              <p>{t("reviews.patterns.empty")}</p>
            </div>
          )}
        </section>

        <MonthlyReflectionSummary analysis={analysis} />
      </div>
    </section>
  );
}

function buildInsightCards(
  analysis: ReviewPatternAnalysis,
  language: "en" | "fa",
  t: (key: string, values?: Record<string, string | number>) => string,
): InsightCard[] {
  const insights: InsightCard[] = [];

  if (analysis.mostCommonDistraction) {
    insights.push({
      id: "common-distraction",
      title: t("reviews.patterns.commonDistractionTitle"),
      detail: t("reviews.patterns.commonDistractionDetail", {
        value: analysis.mostCommonDistraction,
      }),
      tone: "neutral",
    });
  }

  if (analysis.averageMoodTrendDirection !== "insufficient-data") {
    insights.push({
      id: "mood-trend",
      title: t("reviews.patterns.moodDirectionTitle"),
      detail: t(`reviews.patterns.moodDirection.${analysis.averageMoodTrendDirection}`),
      tone:
        analysis.averageMoodTrendDirection === "up"
          ? "positive"
          : analysis.averageMoodTrendDirection === "down"
            ? "warning"
            : "neutral",
    });
  }

  if (analysis.bestEnergyDayOfWeek !== null) {
    insights.push({
      id: "best-energy-day",
      title: t("reviews.patterns.bestEnergyDayTitle"),
      detail: t("reviews.patterns.bestEnergyDayDetail", {
        day: formatWeekday(analysis.bestEnergyDayOfWeek, language),
      }),
      tone: "positive",
    });
  }

  if (analysis.bestMoodDayOfWeek !== null && analysis.worstMoodDayOfWeek !== null) {
    insights.push({
      id: "mood-weekday-pattern",
      title: t("reviews.patterns.moodWeekdayPatternTitle"),
      detail: t("reviews.patterns.moodWeekdayPatternDetail", {
        bestDay: formatWeekday(analysis.bestMoodDayOfWeek, language),
        worstDay: formatWeekday(analysis.worstMoodDayOfWeek, language),
      }),
      tone: "neutral",
    });
  }

  if (analysis.mostFrequentBlockerKeyword) {
    insights.push({
      id: "common-blocker",
      title: t("reviews.patterns.commonBlockerTitle"),
      detail: t("reviews.patterns.commonBlockerDetail", {
        value: analysis.mostFrequentBlockerKeyword,
      }),
      tone: "warning",
    });
  }

  if (analysis.mostConsistentReviewDayType !== "insufficient-data") {
    insights.push({
      id: "review-consistency",
      title: t("reviews.patterns.reviewConsistencyTitle"),
      detail: t(`reviews.patterns.reviewConsistency.${analysis.mostConsistentReviewDayType}`),
      tone: "positive",
    });
  }

  return insights;
}

function formatWeekday(day: number, language: "en" | "fa"): string {
  const date = new Date(2024, 0, 7 + day);

  return new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-US", {
    weekday: "long",
  }).format(date);
}
