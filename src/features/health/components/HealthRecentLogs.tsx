import { Trash2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { calculateHealthScore } from "@/features/health/services/healthCalculations";
import { HealthLog } from "@/features/health/types/health.types";

interface HealthRecentLogsProps {
  logs: HealthLog[];
  onDelete: (id: string) => void;
}

export function HealthRecentLogs({
  logs,
  onDelete,
}: HealthRecentLogsProps): JSX.Element {
  const recentLogs = logs.slice(0, 7);

  return (
    <Card
      subtitle="The latest local entries from your device."
      title="Recent Logs"
    >
      {recentLogs.length === 0 ? (
        <EmptyState
          title="No health logs yet"
          description="Save today's quick log to start building a local health history."
        />
      ) : (
        <div className="health-log-list">
          {recentLogs.map((log) => {
            const score = calculateHealthScore(log);

            return (
              <article className="health-log-card" key={log.id}>
                <div className="health-log-card__main">
                  <div>
                    <span className="health-log-card__label">Date</span>
                    <strong>{formatDate(log.date)}</strong>
                  </div>
                  <div>
                    <span className="health-log-card__label">Score</span>
                    <strong>{score.total}/100</strong>
                  </div>
                </div>

                <div className="health-log-card__metrics">
                  <span>Sleep {formatNumber(log.sleepHours)} h</span>
                  <span>Water {formatNumber(log.waterLiters)} L</span>
                  <span>Workout {log.workoutMinutes} min</span>
                  <span>Energy {log.energyLevel}/5</span>
                  <span>Stress {log.stressLevel}/5</span>
                  <span>Weight {formatNumber(log.weightKg)} kg</span>
                </div>

                <button
                  aria-label={`Delete health log for ${formatDate(log.date)}`}
                  className="icon-button health-log-card__delete"
                  onClick={() => onDelete(log.id)}
                  title="Delete log"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
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

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
