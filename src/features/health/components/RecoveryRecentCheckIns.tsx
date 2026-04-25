import { Trash2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { calculateReadinessScore } from "@/features/health/services/healthCalculations";
import {
  HealthLog,
  RecoveryCheckIn,
  WorkoutLog,
} from "@/features/health/types/health.types";

interface RecoveryRecentCheckInsProps {
  checkIns: RecoveryCheckIn[];
  healthLogs: HealthLog[];
  onDelete: (id: string) => void;
  workoutLogs: WorkoutLog[];
}

export function RecoveryRecentCheckIns({
  checkIns,
  healthLogs,
  onDelete,
  workoutLogs,
}: RecoveryRecentCheckInsProps): JSX.Element {
  const recentCheckIns = checkIns.slice(0, 10);

  return (
    <Card title="Recent Check-ins" subtitle="Latest 10 recovery check-ins.">
      {recentCheckIns.length === 0 ? (
        <EmptyState
          title="No recovery check-ins yet"
          description="Save today's check-in to start tracking readiness."
        />
      ) : (
        <div className="health-log-list recovery-checkin-list">
          {recentCheckIns.map((checkIn) => {
            const readiness = calculateReadinessScore({
              checkIn,
              workoutLogs,
              healthLogs,
            });

            return (
              <article className="health-log-card recovery-checkin-card" key={checkIn.id}>
                <div className="health-log-card__main">
                  <div>
                    <span className="health-log-card__label">Date</span>
                    <strong>{formatDate(checkIn.date)}</strong>
                  </div>
                  <div>
                    <span className="health-log-card__label">Readiness</span>
                    <strong>
                      {readiness.score}/100 {readiness.status}
                    </strong>
                  </div>
                </div>
                <div className="health-log-card__metrics">
                  <span>Sleep {checkIn.sleepQuality}/5</span>
                  <span>Energy {checkIn.energyLevel}/5</span>
                  <span>Stress {checkIn.stressLevel}/5</span>
                  <span>Soreness {checkIn.sorenessLevel}/5</span>
                  <span>Mood {checkIn.moodLevel}/5</span>
                  <span>{checkIn.restingFeeling}</span>
                </div>
                <button
                  aria-label={`Delete recovery check-in for ${formatDate(checkIn.date)}`}
                  className="icon-button health-log-card__delete"
                  onClick={() => onDelete(checkIn.id)}
                  title="Delete check-in"
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
