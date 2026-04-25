import { Trash2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { WorkoutLog } from "@/features/health/types/health.types";

interface WorkoutRecentLogsProps {
  logs: WorkoutLog[];
  onDelete: (id: string) => void;
}

export function WorkoutRecentLogs({
  logs,
  onDelete,
}: WorkoutRecentLogsProps): JSX.Element {
  const recentLogs = logs.slice(0, 10);

  return (
    <Card title="Recent Workouts" subtitle="Latest 10 saved workout logs.">
      {recentLogs.length === 0 ? (
        <EmptyState
          title="No workouts yet"
          description="Save a workout to start building your local training history."
        />
      ) : (
        <div className="health-log-list workout-log-list">
          {recentLogs.map((log) => (
            <article className="health-log-card workout-log-card" key={log.id}>
              <div className="health-log-card__main">
                <div>
                  <span className="health-log-card__label">Workout</span>
                  <strong>{log.title}</strong>
                </div>
                <div>
                  <span className="health-log-card__label">Date</span>
                  <strong>{formatDate(log.date)}</strong>
                </div>
              </div>

              <div className="health-log-card__metrics">
                <span>{log.workoutType}</span>
                <span>{log.intensity}</span>
                <span>{log.durationMinutes} min</span>
                <span>{log.completed ? "Completed" : "Planned"}</span>
                <span>{log.caloriesBurned} kcal</span>
                <span>{log.exercises.length} exercises</span>
                <span>Effort {log.perceivedEffort}/10</span>
              </div>

              <button
                aria-label={`Delete workout log for ${formatDate(log.date)}`}
                className="icon-button health-log-card__delete"
                onClick={() => onDelete(log.id)}
                title="Delete log"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
