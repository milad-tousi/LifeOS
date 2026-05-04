import { ReviewPatternAnalysis } from "@/features/reviews/utils/analyzeReviewPatterns";
import { useI18n } from "@/i18n";
import { formatNumber, formatWeekRange } from "@/i18n/formatters";

interface MonthlyReflectionSummaryProps {
  analysis: ReviewPatternAnalysis;
}

export function MonthlyReflectionSummary({
  analysis,
}: MonthlyReflectionSummaryProps): JSX.Element {
  const { language, t } = useI18n();
  const summary = analysis.monthlySummary;
  const items = [
    {
      label: t("reviews.stats.reviewsCompleted"),
      value: formatNumber(summary.reviewsCompleted, language),
    },
    { label: t("reviews.stats.avgMood"), value: formatScore(summary.averageMood, language, t) },
    { label: t("reviews.stats.avgEnergy"), value: formatScore(summary.averageEnergy, language, t) },
    {
      label: t("reviews.stats.commonBlocker"),
      value: summary.mostCommonBlocker ?? t("reviews.empty.notEnoughData"),
    },
    {
      label: t("reviews.stats.bestWeek"),
      value: summary.bestPerformingWeek
        ? formatWeekRange(
            parseDateKey(summary.bestPerformingWeek.start),
            parseDateKey(summary.bestPerformingWeek.end),
            language,
          )
        : t("reviews.empty.notEnoughData"),
    },
  ];

  return (
    <section className="review-card monthly-reflection-summary">
      <div className="review-card__header">
        <div>
          <h2>{t("reviews.summary.monthlyTitle")}</h2>
          <p>{t("reviews.summary.monthlySubtitle")}</p>
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

function formatScore(
  value: number | null,
  language: "en" | "fa",
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  return value === null ? t("reviews.empty.notEnoughData") : `${formatNumber(value, language)}/5`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}
