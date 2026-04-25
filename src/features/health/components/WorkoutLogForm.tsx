import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { WorkoutExerciseBuilder } from "@/features/health/components/WorkoutExerciseBuilder";
import {
  estimateWorkoutCalories,
  getTodayDateKey,
} from "@/features/health/services/healthCalculations";
import {
  ExerciseLibraryItem,
  WorkoutExercise,
  WorkoutIntensity,
  WorkoutLog,
  WorkoutLogInput,
  WorkoutType,
} from "@/features/health/types/health.types";

interface WorkoutLogFormProps {
  exercises: WorkoutExercise[];
  onAddExercise: (exercise: ExerciseLibraryItem) => void;
  onExercisesChange: (exercises: WorkoutExercise[]) => void;
  onSave: (input: WorkoutLogInput) => void;
  todayWorkout: WorkoutLog | null;
}

interface WorkoutFormState {
  date: string;
  title: string;
  workoutType: WorkoutType;
  intensity: WorkoutIntensity;
  durationMinutes: string;
  completed: boolean;
  perceivedEffort: number;
  note: string;
}

type WorkoutFormErrors = Record<string, string | undefined>;

const WORKOUT_TYPES: WorkoutType[] = [
  "Strength",
  "Cardio",
  "Mobility",
  "Stretching",
  "Mixed",
  "Custom",
];
const INTENSITIES: WorkoutIntensity[] = ["Low", "Medium", "High"];

export function WorkoutLogForm({
  exercises,
  onAddExercise,
  onExercisesChange,
  onSave,
  todayWorkout,
}: WorkoutLogFormProps): JSX.Element {
  const [formState, setFormState] = useState<WorkoutFormState>(() =>
    getFormStateFromLog(todayWorkout),
  );
  const [errors, setErrors] = useState<WorkoutFormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFormState(getFormStateFromLog(todayWorkout));
    setErrors({});
    setSuccessMessage("");
  }, [todayWorkout]);

  const calculatedDuration = useMemo(
    () => exercises.reduce((sum, exercise) => sum + exercise.durationMinutes, 0),
    [exercises],
  );
  const finalDuration = formState.durationMinutes.trim()
    ? parseNumber(formState.durationMinutes)
    : calculatedDuration;
  const estimatedCalories = estimateWorkoutCalories(finalDuration, formState.intensity);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const nextErrors = validateWorkout(formState, exercises, finalDuration);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage("");
      return;
    }

    onSave({
      date: formState.date,
      title: formState.title.trim() || `${formState.workoutType} workout`,
      workoutType: formState.workoutType,
      intensity: formState.intensity,
      durationMinutes: finalDuration,
      exercises,
      completed: formState.completed,
      caloriesBurned: estimatedCalories,
      perceivedEffort: formState.perceivedEffort,
      note: formState.note.trim(),
    });
    setSuccessMessage("Workout log was saved.");
  }

  function resetForm(): void {
    setFormState(getFormStateFromLog(todayWorkout));
    onExercisesChange(todayWorkout?.exercises ?? []);
    setErrors({});
    setSuccessMessage("");
  }

  return (
    <Card title="Workout Log" subtitle="Plan or record today's training session.">
      <form className="health-form workout-form" onSubmit={handleSubmit}>
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

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Workout title</span>
          <input
            className="auth-form__input"
            maxLength={80}
            onChange={(event) =>
              setFormState((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Upper body strength"
            value={formState.title}
          />
          {errors.title ? <p className="auth-form__error">{errors.title}</p> : null}
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Workout type</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                workoutType: event.target.value as WorkoutType,
              }))
            }
            value={formState.workoutType}
          >
            {WORKOUT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Intensity</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                intensity: event.target.value as WorkoutIntensity,
              }))
            }
            value={formState.intensity}
          >
            {INTENSITIES.map((intensity) => (
              <option key={intensity} value={intensity}>
                {intensity}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Duration minutes</span>
          <input
            className="auth-form__input"
            inputMode="numeric"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                durationMinutes: event.target.value,
              }))
            }
            placeholder={`${calculatedDuration}`}
            type="number"
            value={formState.durationMinutes}
          />
          {errors.durationMinutes ? (
            <p className="auth-form__error">{errors.durationMinutes}</p>
          ) : null}
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Perceived effort</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                perceivedEffort: Number(event.target.value),
              }))
            }
            value={formState.perceivedEffort}
          >
            {Array.from({ length: 10 }, (_, index) => index + 1).map((effort) => (
              <option key={effort} value={effort}>
                {effort}
              </option>
            ))}
          </select>
        </label>

        <label className="health-form__check">
          <input
            checked={formState.completed}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                completed: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span>Completed</span>
        </label>

        <div className="workout-calorie-preview">
          Estimated calories: <strong>{estimatedCalories}</strong>
        </div>

        <div className="health-form__field--wide">
          <WorkoutExerciseBuilder
            errors={errors}
            exercises={exercises}
            onAddExercise={onAddExercise}
            onChange={onExercisesChange}
          />
        </div>

        <label className="auth-form__field health-form__field health-form__field--wide">
          <span className="auth-form__label">Notes</span>
          <textarea
            className="auth-form__input health-form__note"
            maxLength={500}
            onChange={(event) =>
              setFormState((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="How the session felt, modifications, or next time notes"
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
            <Button type="submit">Save workout</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function getFormStateFromLog(log: WorkoutLog | null): WorkoutFormState {
  if (!log) {
    return {
      date: getTodayDateKey(),
      title: "",
      workoutType: "Strength",
      intensity: "Medium",
      durationMinutes: "",
      completed: false,
      perceivedEffort: 5,
      note: "",
    };
  }

  return {
    date: log.date,
    title: log.title,
    workoutType: log.workoutType,
    intensity: log.intensity,
    durationMinutes: log.durationMinutes > 0 ? log.durationMinutes.toString() : "",
    completed: log.completed,
    perceivedEffort: log.perceivedEffort,
    note: log.note,
  };
}

function validateWorkout(
  formState: WorkoutFormState,
  exercises: WorkoutExercise[],
  finalDuration: number,
): WorkoutFormErrors {
  const errors: WorkoutFormErrors = {};

  if (formState.title.length > 80) {
    errors.title = "Workout title must be 80 characters or fewer.";
  }

  if (finalDuration < 0 || finalDuration > 600) {
    errors.durationMinutes = "Duration must be between 0 and 600 minutes.";
  }

  if (formState.perceivedEffort < 1 || formState.perceivedEffort > 10) {
    errors.perceivedEffort = "Perceived effort must be between 1 and 10.";
  }

  if (formState.note.length > 500) {
    errors.note = "Notes must be 500 characters or fewer.";
  }

  exercises.forEach((exercise, index) => {
    addRangeError(errors, `${index}.sets`, exercise.sets, 0, 20, "Sets");
    addRangeError(errors, `${index}.reps`, exercise.reps, 0, 500, "Reps");
    addRangeError(errors, `${index}.weightKg`, exercise.weightKg, 0, 500, "Weight");
    addRangeError(
      errors,
      `${index}.durationMinutes`,
      exercise.durationMinutes,
      0,
      300,
      "Exercise duration",
    );

    if (exercise.notes.length > 500) {
      errors[`${index}.notes`] = "Exercise notes must be 500 characters or fewer.";
    }
  });

  return errors;
}

function addRangeError(
  errors: WorkoutFormErrors,
  key: string,
  value: number,
  min: number,
  max: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    errors[key] = `${label} must be between ${min} and ${max}.`;
  }
}

function parseNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
