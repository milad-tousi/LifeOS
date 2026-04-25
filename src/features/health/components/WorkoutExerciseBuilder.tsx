import { Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { exerciseLibrary } from "@/features/health/data/exerciseLibrary";
import {
  ExerciseLibraryItem,
  WorkoutExercise,
} from "@/features/health/types/health.types";

interface WorkoutExerciseBuilderProps {
  errors: Record<string, string | undefined>;
  exercises: WorkoutExercise[];
  onAddExercise: (exercise: ExerciseLibraryItem) => void;
  onChange: (exercises: WorkoutExercise[]) => void;
}

export function WorkoutExerciseBuilder({
  errors,
  exercises,
  onAddExercise,
  onChange,
}: WorkoutExerciseBuilderProps): JSX.Element {
  function updateExercise(
    exerciseId: string,
    field: keyof WorkoutExercise,
    value: string | number,
  ): void {
    onChange(
      exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
      ),
    );
  }

  function removeExercise(exerciseId: string): void {
    onChange(exercises.filter((exercise) => exercise.id !== exerciseId));
  }

  return (
    <div className="workout-exercise-builder">
      <div className="workout-exercise-builder__add">
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Add exercise</span>
          <select
            className="auth-form__input"
            onChange={(event) => {
              const selectedExercise = exerciseLibrary.find(
                (exercise) => exercise.id === event.target.value,
              );

              if (selectedExercise) {
                onAddExercise(selectedExercise);
                event.target.value = "";
              }
            }}
            value=""
          >
            <option value="">Choose from library</option>
            {exerciseLibrary.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="workout-exercise-list">
        {exercises.length === 0 ? (
          <p className="workout-empty-inline">
            Add exercises from the selector or library panel.
          </p>
        ) : (
          exercises.map((exercise, index) => (
            <article className="workout-exercise-card" key={exercise.id}>
              <div className="workout-exercise-card__header">
                <div>
                  <strong>{exercise.name}</strong>
                  <span>{exercise.targetMuscles}</span>
                </div>
                <Button
                  aria-label={`Remove ${exercise.name}`}
                  onClick={() => removeExercise(exercise.id)}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="workout-exercise-card__grid">
                <WorkoutNumberInput
                  error={errors[`${index}.sets`]}
                  label="Sets"
                  onChange={(value) => updateExercise(exercise.id, "sets", value)}
                  value={exercise.sets}
                />
                <WorkoutNumberInput
                  error={errors[`${index}.reps`]}
                  label="Reps"
                  onChange={(value) => updateExercise(exercise.id, "reps", value)}
                  value={exercise.reps}
                />
                <WorkoutNumberInput
                  error={errors[`${index}.weightKg`]}
                  label="Weight kg"
                  onChange={(value) => updateExercise(exercise.id, "weightKg", value)}
                  value={exercise.weightKg}
                />
                <WorkoutNumberInput
                  error={errors[`${index}.durationMinutes`]}
                  label="Duration"
                  onChange={(value) =>
                    updateExercise(exercise.id, "durationMinutes", value)
                  }
                  value={exercise.durationMinutes}
                />
              </div>

              <label className="auth-form__field health-form__field">
                <span className="auth-form__label">Exercise notes</span>
                <input
                  className="auth-form__input"
                  maxLength={500}
                  onChange={(event) =>
                    updateExercise(exercise.id, "notes", event.target.value)
                  }
                  placeholder="Tempo, setup, or cues"
                  value={exercise.notes}
                />
              </label>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

interface WorkoutNumberInputProps {
  error: string | undefined;
  label: string;
  onChange: (value: number) => void;
  value: number;
}

function WorkoutNumberInput({
  error,
  label,
  onChange,
  value,
}: WorkoutNumberInputProps): JSX.Element {
  return (
    <label className="auth-form__field health-form__field">
      <span className="auth-form__label">{label}</span>
      <input
        className="auth-form__input"
        inputMode="decimal"
        min="0"
        onChange={(event) => onChange(parseNumber(event.target.value))}
        step="0.1"
        type="number"
        value={value}
      />
      {error ? <p className="auth-form__error">{error}</p> : null}
    </label>
  );
}

function parseNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
