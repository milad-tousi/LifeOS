import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import {
  ExerciseLibraryItem,
  WorkoutType,
} from "@/features/health/types/health.types";

interface ExerciseLibraryPanelProps {
  exercises: ExerciseLibraryItem[];
  onAddExercise: (exercise: ExerciseLibraryItem) => void;
}

const CATEGORY_FILTERS: Array<"All" | WorkoutType> = [
  "All",
  "Strength",
  "Cardio",
  "Mobility",
  "Stretching",
  "Mixed",
  "Custom",
];

export function ExerciseLibraryPanel({
  exercises,
  onAddExercise,
}: ExerciseLibraryPanelProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<"All" | WorkoutType>("All");

  const filteredExercises = useMemo(
    () =>
      exercises.filter((exercise) => {
        const matchesSearch = exercise.name
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());
        const matchesCategory = category === "All" || exercise.category === category;

        return matchesSearch && matchesCategory;
      }),
    [category, exercises, searchTerm],
  );

  return (
    <Card title="Exercise Library" subtitle="Search and add movements to the workout.">
      <div className="exercise-library">
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Search</span>
          <input
            className="auth-form__input"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search exercises"
            value={searchTerm}
          />
        </label>

        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Category</span>
          <select
            className="auth-form__input"
            onChange={(event) => setCategory(event.target.value as "All" | WorkoutType)}
            value={category}
          >
            {CATEGORY_FILTERS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="exercise-library__list">
          {filteredExercises.map((exercise) => (
            <article className="exercise-library__item" key={exercise.id}>
              <div>
                <strong>{exercise.name}</strong>
                <span>{exercise.targetMuscles}</span>
                <small>
                  {exercise.equipment} | {exercise.difficulty}
                </small>
              </div>
              <Button onClick={() => onAddExercise(exercise)} type="button" variant="secondary">
                Add
              </Button>
            </article>
          ))}
        </div>
      </div>
    </Card>
  );
}
