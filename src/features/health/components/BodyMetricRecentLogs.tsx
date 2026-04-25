import { Trash2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { calculateBmi } from "@/features/health/services/healthCalculations";
import { BodyMetricLog } from "@/features/health/types/health.types";

interface BodyMetricRecentLogsProps {
  logs: BodyMetricLog[];
  onDelete: (id: string) => void;
}

export function BodyMetricRecentLogs({
  logs,
  onDelete,
}: BodyMetricRecentLogsProps): JSX.Element {
  const recentLogs = logs.slice(0, 10);

  return (
    <Card title="Recent Body Logs" subtitle="Latest 10 body metric entries.">
      {recentLogs.length === 0 ? (
        <EmptyState
          title="No body metrics yet"
          description="Save today's body metrics to start tracking changes over time."
        />
      ) : (
        <div className="health-log-list body-metric-log-list">
          {recentLogs.map((log) => {
            const bmi = calculateBmi(log.weightKg, log.heightCm);

            return (
              <article className="health-log-card body-metric-log-card" key={log.id}>
                <div className="health-log-card__main">
                  <div>
                    <span className="health-log-card__label">Date</span>
                    <strong>{formatDate(log.date)}</strong>
                  </div>
                  <div>
                    <span className="health-log-card__label">BMI</span>
                    <strong>{bmi === null ? "--" : bmi}</strong>
                  </div>
                </div>

                <div className="health-log-card__metrics">
                  <span>Weight {formatNullable(log.weightKg, "kg")}</span>
                  <span>Height {formatNullable(log.heightCm, "cm")}</span>
                  <span>Body fat {formatNullable(log.bodyFatPercent, "%")}</span>
                  <span>Muscle {formatNullable(log.muscleMassKg, "kg")}</span>
                  <span>Waist {formatNullable(log.waistCm, "cm")}</span>
                </div>

                <button
                  aria-label={`Delete body metric log for ${formatDate(log.date)}`}
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

function formatNullable(value: number, unit: string): string {
  if (value <= 0) {
    return "--";
  }

  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  return `${formattedValue} ${unit}`;
}
