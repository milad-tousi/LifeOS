import { useEffect, useState } from "react";
import { Card } from "@/components/common/Card";
import { ExerciseLibraryPanel } from "@/features/health/components/ExerciseLibraryPanel";
import { WorkoutLogForm } from "@/features/health/components/WorkoutLogForm";
import { WorkoutOverviewCards } from "@/features/health/components/WorkoutOverviewCards";
import { WorkoutRecentLogs } from "@/features/health/components/WorkoutRecentLogs";
import { exerciseLibrary } from "@/features/health/data/exerciseLibrary";
import { getTodayDateKey } from "@/features/health/services/healthCalculations";
import {
  ExerciseLibraryItem,
  WorkoutExercise,
  WorkoutLog,
  WorkoutLogInput,
  WorkoutOverviewStats,
} from "@/features/health/types/health.types";
import { createId } from "@/lib/id";

interface WorkoutTabProps {
  logs: WorkoutLog[];
  onDeleteLog: (id: string) => void;
  onSaveLog: (input: WorkoutLogInput) => void;
  overviewStats: WorkoutOverviewStats;
}

export function WorkoutTab({
  logs,
  onDeleteLog,
  onSaveLog,
  overviewStats,
}: WorkoutTabProps): JSX.Element {
  const todayWorkout = logs.find((log) => log.date === getTodayDateKey()) ?? null;
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    () => todayWorkout?.exercises ?? [],
  );

  useEffect(() => {
    setExercises(todayWorkout?.exercises ?? []);
  }, [todayWorkout]);

  function addExercise(exercise: ExerciseLibraryItem): void {
    setExercises((currentExercises) => [
      ...currentExercises,
      {
        id: createId(),
        exerciseId: exercise.id,
        name: exercise.name,
        targetMuscles: exercise.targetMuscles,
        equipment: exercise.equipment,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps,
        weightKg: 0,
        durationMinutes: exercise.defaultDurationMinutes,
        notes: "",
      },
    ]);
  }

  return (
    <div className="health-tab-panel">
      <Card
        title="Workout"
        subtitle="Plan, log, and review your training sessions locally."
      />

      <WorkoutOverviewCards stats={overviewStats} />

      <div className="workout-layout">
        <WorkoutLogForm
          exercises={exercises}
          onAddExercise={addExercise}
          onExercisesChange={setExercises}
          onSave={onSaveLog}
          todayWorkout={todayWorkout}
        />
        <div className="workout-layout__side">
          <ExerciseLibraryPanel
            exercises={exerciseLibrary}
            onAddExercise={addExercise}
          />
          <WorkoutRecentLogs logs={logs} onDelete={onDeleteLog} />
        </div>
      </div>
    </div>
  );
}
