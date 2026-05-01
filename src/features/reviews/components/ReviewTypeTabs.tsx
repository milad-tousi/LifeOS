import { ReviewType } from "@/features/reviews/types/review.types";

interface ReviewTypeTabsProps {
  activeType: ReviewType;
  onChange: (type: ReviewType) => void;
}

const reviewTypes: Array<{ label: string; value: ReviewType }> = [
  { label: "Daily Review", value: "daily" },
  { label: "Weekly Review", value: "weekly" },
  { label: "Monthly Review", value: "monthly" },
];

export function ReviewTypeTabs({ activeType, onChange }: ReviewTypeTabsProps): JSX.Element {
  return (
    <div className="review-tabs" aria-label="Review type">
      {reviewTypes.map((type) => (
        <button
          className={`review-tabs__item${
            activeType === type.value ? " review-tabs__item--active" : ""
          }`}
          key={type.value}
          onClick={() => onChange(type.value)}
          type="button"
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
