import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import {
  HealthLog,
  HealthLogInput,
  HealthRating,
} from "@/features/health/types/health.types";

interface HealthQuickLogFormProps {
  todayLog: HealthLog | null;
  onSave: (input: HealthLogInput) => void;
}

interface HealthQuickLogFormState {
  weightKg: string;
  sleepHours: string;
  waterLiters: string;
  workoutMinutes: string;
  workoutCompleted: boolean;
  calories: string;
  proteinGrams: string;
  energyLevel: HealthRating;
  stressLevel: HealthRating;
  note: string;
}

const EMPTY_FORM_STATE: HealthQuickLogFormState = {
  weightKg: "",
  sleepHours: "",
  waterLiters: "",
  workoutMinutes: "",
  workoutCompleted: false,
  calories: "",
  proteinGrams: "",
  energyLevel: 3,
  stressLevel: 3,
  note: "",
};

const RATING_OPTIONS: HealthRating[] = [1, 2, 3, 4, 5];

export function HealthQuickLogForm({
  onSave,
  todayLog,
}: HealthQuickLogFormProps): JSX.Element {
  const [formState, setFormState] = useState<HealthQuickLogFormState>(() =>
    getFormStateFromLog(todayLog),
  );
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState(getFormStateFromLog(todayLog));
  }, [todayLog]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    onSave({
      weightKg: parsePositiveNumber(formState.weightKg),
      sleepHours: parsePositiveNumber(formState.sleepHours),
      waterLiters: parsePositiveNumber(formState.waterLiters),
      workoutMinutes: parsePositiveNumber(formState.workoutMinutes),
      workoutCompleted: formState.workoutCompleted,
      calories: parsePositiveNumber(formState.calories),
      proteinGrams: parsePositiveNumber(formState.proteinGrams),
      energyLevel: formState.energyLevel,
      stressLevel: formState.stressLevel,
      note: formState.note.trim(),
    });
    setSuccessMessage("Today's health log was saved.");
  }

  function resetForm(): void {
    setFormState(getFormStateFromLog(todayLog));
    setSuccessMessage("");
  }

  return (
    <Card
      subtitle="Update today's body, recovery, nutrition, and workout signals in one pass."
      title="Quick Log"
    >
      <form className="health-form" onSubmit={handleSubmit}>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Weight kg</span>
          <input
            className="auth-form__input"
            inputMode="decimal"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({ ...current, weightKg: event.target.value }))
            }
            placeholder="78"
            step="0.1"
            type="number"
            value={formState.weightKg}
          />
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Sleep hours</span>
          <input
            className="auth-form__input"
            inputMode="decimal"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({ ...current, sleepHours: event.target.value }))
            }
            placeholder="7.5"
            step="0.1"
            type="number"
            value={formState.sleepHours}
          />
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Water liters</span>
          <input
            className="auth-form__input"
            inputMode="decimal"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({ ...current, waterLiters: event.target.value }))
            }
            placeholder="2.4"
            step="0.1"
            type="number"
            value={formState.waterLiters}
          />
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Workout minutes</span>
          <input
            className="auth-form__input"
            inputMode="numeric"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                workoutMinutes: event.target.value,
              }))
            }
            placeholder="30"
            step="1"
            type="number"
            value={formState.workoutMinutes}
          />
        </label>

        <label className="health-form__check">
          <input
            checked={formState.workoutCompleted}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                workoutCompleted: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span>Workout completed</span>
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Calories</span>
          <input
            className="auth-form__input"
            inputMode="numeric"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({ ...current, calories: event.target.value }))
            }
            placeholder="2200"
            step="1"
            type="number"
            value={formState.calories}
          />
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Protein grams</span>
          <input
            className="auth-form__input"
            inputMode="decimal"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({ ...current, proteinGrams: event.target.value }))
            }
            placeholder="130"
            step="0.1"
            type="number"
            value={formState.proteinGrams}
          />
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Energy level</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                energyLevel: Number(event.target.value) as HealthRating,
              }))
            }
            value={formState.energyLevel}
          >
            {RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Stress level</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                stressLevel: Number(event.target.value) as HealthRating,
              }))
            }
            value={formState.stressLevel}
          >
            {RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-form__field health-form__field health-form__field--wide">
          <span className="auth-form__label">Note</span>
          <textarea
            className="auth-form__input health-form__note"
            onChange={(event) =>
              setFormState((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="Anything useful about recovery, training, meals, or mood"
            value={formState.note}
          />
        </label>

        <div className="health-form__footer">
          <div className="health-form__feedback" aria-live="polite">
            {successMessage ? <p>{successMessage}</p> : null}
          </div>
          <div className="health-form__actions">
            <Button onClick={resetForm} type="button" variant="secondary">
              Reset form
            </Button>
            <Button type="submit">Save today's log</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function getFormStateFromLog(log: HealthLog | null): HealthQuickLogFormState {
  if (!log) {
    return EMPTY_FORM_STATE;
  }

  return {
    weightKg: numberToInputValue(log.weightKg),
    sleepHours: numberToInputValue(log.sleepHours),
    waterLiters: numberToInputValue(log.waterLiters),
    workoutMinutes: numberToInputValue(log.workoutMinutes),
    workoutCompleted: log.workoutCompleted,
    calories: numberToInputValue(log.calories),
    proteinGrams: numberToInputValue(log.proteinGrams),
    energyLevel: log.energyLevel,
    stressLevel: log.stressLevel,
    note: log.note,
  };
}

function parsePositiveNumber(value: string): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function numberToInputValue(value: number): string {
  return value > 0 ? value.toString() : "";
}
