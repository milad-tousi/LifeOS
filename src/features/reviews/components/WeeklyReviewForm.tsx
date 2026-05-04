import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import {
  WeeklyReviewInput,
  WeeklySelfRating,
} from "@/features/reviews/types/review.types";
import { useI18n } from "@/i18n";

interface WeeklyReviewFormProps {
  isComplete: boolean;
  onSubmit: (input: WeeklyReviewInput) => string | null;
}

interface WeeklyReviewFormState {
  biggestAchievement: string;
  blockers: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  selfRating: WeeklySelfRating;
}

const defaultState: WeeklyReviewFormState = {
  biggestAchievement: "",
  blockers: "",
  lessonsLearned: "",
  nextWeekFocus: "",
  selfRating: 7,
};

export function WeeklyReviewForm({
  isComplete,
  onSubmit,
}: WeeklyReviewFormProps): JSX.Element {
  const { t } = useI18n();
  const [formState, setFormState] = useState<WeeklyReviewFormState>(defaultState);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (
      !formState.biggestAchievement.trim() ||
      !formState.blockers.trim() ||
      !formState.lessonsLearned.trim() ||
      !formState.nextWeekFocus.trim()
    ) {
      setError(t("reviews.weekly.validationError"));
      return;
    }

    const submitError = onSubmit(formState);

    if (submitError) {
      setError(submitError);
      return;
    }

    setFormState(defaultState);
    setError("");
  }

  if (isComplete) {
    return (
      <section className="review-card">
        <div className="review-complete-state">
          <strong>{t("reviews.weekly.completedTitle")}</strong>
          <p>{t("reviews.weekly.completedDescription")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="review-card">
      <div className="review-card__header">
        <div>
          <h2>{t("reviews.weekly.title")}</h2>
          <p>{t("reviews.weekly.subtitle")}</p>
        </div>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <ReviewTextarea
          label={t("reviews.weekly.biggestAchievement")}
          onChange={(value) =>
            setFormState((current) => ({ ...current, biggestAchievement: value }))
          }
          required
          value={formState.biggestAchievement}
        />
        <ReviewTextarea
          label={t("reviews.weekly.mainBlockers")}
          onChange={(value) => setFormState((current) => ({ ...current, blockers: value }))}
          required
          value={formState.blockers}
        />
        <ReviewTextarea
          label={t("reviews.weekly.lessonsLearned")}
          onChange={(value) =>
            setFormState((current) => ({ ...current, lessonsLearned: value }))
          }
          required
          value={formState.lessonsLearned}
        />
        <ReviewTextarea
          label={t("reviews.weekly.focusNextWeek")}
          onChange={(value) =>
            setFormState((current) => ({ ...current, nextWeekFocus: value }))
          }
          required
          value={formState.nextWeekFocus}
        />

        <fieldset className="review-rating review-rating--wide">
          <legend>{t("reviews.weekly.selfRating")}</legend>
          <div>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
              <button
                className={`review-rating__item${
                  formState.selfRating === rating ? " review-rating__item--active" : ""
                }`}
                key={rating}
                onClick={() =>
                  setFormState((current) => ({
                    ...current,
                    selfRating: rating as WeeklySelfRating,
                  }))
                }
                type="button"
              >
                {rating}
              </button>
            ))}
          </div>
        </fieldset>

        {error ? <p className="review-form__error">{error}</p> : null}

        <div className="review-form__actions">
          <Button type="submit">{t("reviews.weekly.save")}</Button>
        </div>
      </form>
    </section>
  );
}

function ReviewTextarea({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}): JSX.Element {
  return (
    <label className="review-form__field">
      <span>{label}</span>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={4}
        value={value}
      />
    </label>
  );
}
