import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import {
  DailyReviewInput,
  ReviewEnergyScore,
  ReviewMoodScore,
} from "@/features/reviews/types/review.types";

interface DailyReviewFormProps {
  isComplete: boolean;
  onSubmit: (input: DailyReviewInput) => string | null;
}

interface DailyReviewFormState {
  wentWell: string;
  didNotGoWell: string;
  distraction: string;
  mood: ReviewMoodScore;
  energy: ReviewEnergyScore;
  tomorrowFocus: string;
  notes: string;
}

const defaultState: DailyReviewFormState = {
  wentWell: "",
  didNotGoWell: "",
  distraction: "",
  mood: 3,
  energy: 3,
  tomorrowFocus: "",
  notes: "",
};

export function DailyReviewForm({
  isComplete,
  onSubmit,
}: DailyReviewFormProps): JSX.Element {
  const [formState, setFormState] = useState<DailyReviewFormState>(defaultState);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (
      !formState.wentWell.trim() ||
      !formState.didNotGoWell.trim() ||
      !formState.distraction.trim() ||
      !formState.tomorrowFocus.trim()
    ) {
      setError("Please complete the required reflection fields.");
      return;
    }

    const submitError = onSubmit({
      wentWell: formState.wentWell,
      didNotGoWell: formState.didNotGoWell,
      distraction: formState.distraction,
      mood: formState.mood,
      energy: formState.energy,
      tomorrowFocus: formState.tomorrowFocus,
      notes: formState.notes,
    });

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
          <strong>Daily review complete</strong>
          <p>You have already captured today. Come back tomorrow for a fresh review.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="review-card">
      <div className="review-card__header">
        <div>
          <h2>Daily Review</h2>
          <p>Close the day with a clear read on what worked, what pulled focus, and what comes next.</p>
        </div>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <ReviewTextarea
          label="What went well today?"
          onChange={(value) => setFormState((current) => ({ ...current, wentWell: value }))}
          required
          value={formState.wentWell}
        />
        <ReviewTextarea
          label="What did not go well?"
          onChange={(value) => setFormState((current) => ({ ...current, didNotGoWell: value }))}
          required
          value={formState.didNotGoWell}
        />
        <ReviewTextarea
          label="Biggest distraction/challenge"
          onChange={(value) => setFormState((current) => ({ ...current, distraction: value }))}
          required
          value={formState.distraction}
        />

        <div className="review-form__rating-grid">
          <ReviewRating
            label="Mood"
            max={5}
            onChange={(value) =>
              setFormState((current) => ({ ...current, mood: value as ReviewMoodScore }))
            }
            value={formState.mood}
          />
          <ReviewRating
            label="Energy"
            max={5}
            onChange={(value) =>
              setFormState((current) => ({ ...current, energy: value as ReviewEnergyScore }))
            }
            value={formState.energy}
          />
        </div>

        <ReviewTextarea
          label="Main focus for tomorrow"
          onChange={(value) => setFormState((current) => ({ ...current, tomorrowFocus: value }))}
          required
          value={formState.tomorrowFocus}
        />
        <ReviewTextarea
          label="Additional notes"
          onChange={(value) => setFormState((current) => ({ ...current, notes: value }))}
          value={formState.notes}
        />

        {error ? <p className="review-form__error">{error}</p> : null}

        <div className="review-form__actions">
          <Button type="submit">Save Daily Review</Button>
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

function ReviewRating({
  label,
  max,
  onChange,
  value,
}: {
  label: string;
  max: 5 | 10;
  onChange: (value: number) => void;
  value: number;
}): JSX.Element {
  return (
    <fieldset className="review-rating">
      <legend>{label}</legend>
      <div>
        {Array.from({ length: max }, (_, index) => index + 1).map((rating) => (
          <button
            className={`review-rating__item${
              value === rating ? " review-rating__item--active" : ""
            }`}
            key={rating}
            onClick={() => onChange(rating)}
            type="button"
          >
            {rating}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
