import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { getTodayDateKey } from "@/features/health/services/healthCalculations";
import {
  RecoveryCheckIn,
  RecoveryCheckInInput,
  RecoveryRating,
  RestingFeeling,
} from "@/features/health/types/health.types";

interface RecoveryCheckInFormProps {
  onSave: (input: RecoveryCheckInInput) => void;
  todayCheckIn: RecoveryCheckIn | null;
}

interface RecoveryFormState {
  date: string;
  sleepQuality: RecoveryRating;
  sorenessLevel: RecoveryRating;
  moodLevel: RecoveryRating;
  energyLevel: RecoveryRating;
  stressLevel: RecoveryRating;
  restingFeeling: RestingFeeling;
  note: string;
}

const RATINGS: RecoveryRating[] = [1, 2, 3, 4, 5];
const RESTING_FEELINGS: RestingFeeling[] = ["Fresh", "Normal", "Tired", "Exhausted"];

export function RecoveryCheckInForm({
  onSave,
  todayCheckIn,
}: RecoveryCheckInFormProps): JSX.Element {
  const [formState, setFormState] = useState<RecoveryFormState>(() =>
    getFormStateFromCheckIn(todayCheckIn),
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState(getFormStateFromCheckIn(todayCheckIn));
    setErrors({});
    setSuccessMessage("");
  }, [todayCheckIn]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const nextErrors = validateRecoveryForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage("");
      return;
    }

    onSave({
      ...formState,
      note: formState.note.trim(),
    });
    setSuccessMessage("Recovery check-in was saved.");
  }

  function resetForm(): void {
    setFormState(getFormStateFromCheckIn(todayCheckIn));
    setErrors({});
    setSuccessMessage("");
  }

  return (
    <Card
      title="Recovery Check-in"
      subtitle="Log today's recovery signals to estimate readiness."
    >
      <form className="health-form recovery-form" onSubmit={handleSubmit}>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Date</span>
          <input
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({ ...current, date: event.target.value }))
            }
            type="date"
            value={formState.date}
          />
        </label>
        <RecoveryRatingSelect
          label="Sleep quality"
          onChange={(value) => setFormState((current) => ({ ...current, sleepQuality: value }))}
          value={formState.sleepQuality}
        />
        <RecoveryRatingSelect
          label="Soreness level"
          onChange={(value) => setFormState((current) => ({ ...current, sorenessLevel: value }))}
          value={formState.sorenessLevel}
        />
        <RecoveryRatingSelect
          label="Mood level"
          onChange={(value) => setFormState((current) => ({ ...current, moodLevel: value }))}
          value={formState.moodLevel}
        />
        <RecoveryRatingSelect
          label="Energy level"
          onChange={(value) => setFormState((current) => ({ ...current, energyLevel: value }))}
          value={formState.energyLevel}
        />
        <RecoveryRatingSelect
          label="Stress level"
          onChange={(value) => setFormState((current) => ({ ...current, stressLevel: value }))}
          value={formState.stressLevel}
        />
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Resting feeling</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                restingFeeling: event.target.value as RestingFeeling,
              }))
            }
            value={formState.restingFeeling}
          >
            {RESTING_FEELINGS.map((feeling) => (
              <option key={feeling} value={feeling}>
                {feeling}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-form__field health-form__field health-form__field--wide">
          <span className="auth-form__label">Note</span>
          <textarea
            className="auth-form__input health-form__note"
            maxLength={500}
            onChange={(event) =>
              setFormState((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="Sleep context, soreness notes, or recovery plan"
            value={formState.note}
          />
          {errors.note ? <p className="auth-form__error">{errors.note}</p> : null}
        </label>
        <div className="health-form__footer">
          <div className="health-form__feedback" aria-live="polite">
            {successMessage ? <p>{successMessage}</p> : null}
          </div>
          <div className="health-form__actions">
            <Button onClick={resetForm} type="button" variant="secondary">
              Reset form
            </Button>
            <Button type="submit">Save recovery check-in</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

interface RecoveryRatingSelectProps {
  label: string;
  onChange: (value: RecoveryRating) => void;
  value: RecoveryRating;
}

function RecoveryRatingSelect({
  label,
  onChange,
  value,
}: RecoveryRatingSelectProps): JSX.Element {
  return (
    <label className="auth-form__field health-form__field">
      <span className="auth-form__label">{label}</span>
      <select
        className="auth-form__input"
        onChange={(event) => onChange(Number(event.target.value) as RecoveryRating)}
        value={value}
      >
        {RATINGS.map((rating) => (
          <option key={rating} value={rating}>
            {rating}
          </option>
        ))}
      </select>
    </label>
  );
}

function getFormStateFromCheckIn(checkIn: RecoveryCheckIn | null): RecoveryFormState {
  if (!checkIn) {
    return {
      date: getTodayDateKey(),
      sleepQuality: 3,
      sorenessLevel: 3,
      moodLevel: 3,
      energyLevel: 3,
      stressLevel: 3,
      restingFeeling: "Normal",
      note: "",
    };
  }

  return {
    date: checkIn.date,
    sleepQuality: checkIn.sleepQuality,
    sorenessLevel: checkIn.sorenessLevel,
    moodLevel: checkIn.moodLevel,
    energyLevel: checkIn.energyLevel,
    stressLevel: checkIn.stressLevel,
    restingFeeling: checkIn.restingFeeling,
    note: checkIn.note,
  };
}

function validateRecoveryForm(
  formState: RecoveryFormState,
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};

  if (formState.note.length > 500) {
    errors.note = "Note must be 500 characters or fewer.";
  }

  return errors;
}
