import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReviewChartEmptyState } from "@/features/reviews/components/ReviewMoodTrendChart";
import {
  getReviewTrendPoints,
  ReviewTrendRange,
} from "@/features/reviews/utils/analyzeReviewPatterns";
import { ReviewEntry } from "@/features/reviews/types/review.types";
import { useI18n } from "@/i18n";

interface ReviewEnergyTrendChartProps {
  range: ReviewTrendRange;
  reviews: ReviewEntry[];
}

export function ReviewEnergyTrendChart({
  range,
  reviews,
}: ReviewEnergyTrendChartProps): JSX.Element {
  const { language, t } = useI18n();
  const data = getReviewTrendPoints(reviews, range, language);

  return (
    <section className="review-card review-analytics-card">
      <div className="review-card__header">
        <div>
          <h2>{t("reviews.analytics.energyTrend")}</h2>
          <p>{t("reviews.analytics.energyTrendSubtitle")}</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="review-chart">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 12 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                allowDecimals={false}
                domain={[1, 5]}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip formatter={(value: number | string) => [`${value}/5`, t("reviews.daily.energy")]} />
              <Line
                animationDuration={450}
                dataKey="energy"
                dot={data.length <= 7}
                name={t("reviews.daily.energy")}
                stroke="#16a34a"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ReviewChartEmptyState description={t("reviews.empty.saveMoreDailyReviews")} />
      )}
    </section>
  );
}
