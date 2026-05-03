import { ReviewType } from "@/features/reviews/types/review.types";
import { TranslationKey } from "@/i18n/i18n.types";
import { useI18n } from "@/i18n";

interface ReviewTypeTabsProps {
  activeType: ReviewType;
  onChange: (type: ReviewType) => void;
}

const reviewTypes: Array<{ labelKey: TranslationKey; value: ReviewType }> = [
  { labelKey: "reviews.dailyReview", value: "daily" },
  { labelKey: "reviews.weeklyReview", value: "weekly" },
  { labelKey: "reviews.monthlyReview", value: "monthly" },
];

export function ReviewTypeTabs({ activeType, onChange }: ReviewTypeTabsProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="review-tabs" aria-label={t("reviews.title")}>
      {reviewTypes.map((type) => (
        <button
          className={`review-tabs__item${
            activeType === type.value ? " review-tabs__item--active" : ""
          }`}
          key={type.value}
          onClick={() => onChange(type.value)}
          type="button"
        >
          {t(type.labelKey)}
        </button>
      ))}
    </div>
  );
}
