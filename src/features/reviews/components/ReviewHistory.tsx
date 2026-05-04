import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ReviewEntry } from "@/features/reviews/types/review.types";
import { useI18n } from "@/i18n";
import { formatAppDate, formatWeekRange } from "@/i18n/formatters";

type HistoryFilter = "all" | "daily" | "weekly";

interface ReviewHistoryProps {
  reviews: ReviewEntry[];
}

export function ReviewHistory({ reviews }: ReviewHistoryProps): JSX.Element {
  const { language, t } = useI18n();
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
          <h2>{t("reviews.history.title")}</h2>
          <p>{t("reviews.history.subtitle")}</p>
        </div>
        <div className="review-history__filters" aria-label={t("reviews.history.filterLabel")}>
          {(["all", "daily", "weekly"] as const).map((option) => (
            <button
              className={`review-history__filter${
                filter === option ? " review-history__filter--active" : ""
              }`}
              key={option}
              onClick={() => setFilter(option)}
              type="button"
            >
              {getFilterLabel(option, t)}
            </button>
          ))}
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="review-empty-state">
          <strong>{t("reviews.history.emptyTitle")}</strong>
          <p>{t("reviews.history.emptySubtitle")}</p>
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
                    <span>
                      {review.type === "daily" ? t("reviews.tabs.daily") : t("reviews.tabs.weekly")}
                    </span>
                    <strong>{formatReviewHistoryPeriodLabel(review, language)}</strong>
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
  const { t } = useI18n();

  if (review.type === "daily") {
    return (
      <div className="review-history__details">
        <HistoryDetail label={t("reviews.daily.whatWentWell")} value={review.wentWell} />
        <HistoryDetail label={t("reviews.daily.whatWentWrong")} value={review.didNotGoWell} />
        <HistoryDetail label={t("reviews.daily.biggestDistraction")} value={review.distraction} />
        <HistoryDetail label={t("reviews.daily.mood")} value={`${review.mood}/5`} />
        <HistoryDetail label={t("reviews.daily.energy")} value={`${review.energy}/5`} />
        <HistoryDetail label={t("reviews.daily.mainFocusTomorrow")} value={review.tomorrowFocus} />
        {review.notes ? (
          <HistoryDetail label={t("reviews.daily.additionalNotes")} value={review.notes} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="review-history__details">
      <HistoryDetail label={t("reviews.weekly.biggestAchievement")} value={review.biggestAchievement} />
      <HistoryDetail label={t("reviews.weekly.mainBlockers")} value={review.blockers} />
      <HistoryDetail label={t("reviews.weekly.lessonsLearned")} value={review.lessonsLearned} />
      <HistoryDetail label={t("reviews.weekly.focusNextWeek")} value={review.nextWeekFocus} />
      <HistoryDetail label={t("reviews.weekly.selfRating")} value={`${review.selfRating}/10`} />
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

function getFilterLabel(
  filter: HistoryFilter,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  switch (filter) {
    case "all":
      return t("reviews.tabs.all");
    case "daily":
      return t("reviews.tabs.daily");
    case "weekly":
      return t("reviews.tabs.weekly");
  }
}

function formatReviewHistoryPeriodLabel(review: ReviewEntry, language: "en" | "fa"): string {
  if (review.type === "daily") {
    return formatAppDate(review.date, language);
  }

  return formatWeekRange(parseDateKey(review.weekStart), parseDateKey(review.weekEnd), language);
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}
