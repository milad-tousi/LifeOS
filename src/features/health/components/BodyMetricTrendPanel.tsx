import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { calculateBodyMetricTrend } from "@/features/health/services/healthCalculations";
import {
  BodyMetricLog,
  BodyMetricOverviewStats,
} from "@/features/health/types/health.types";

interface BodyMetricTrendPanelProps {
  logs: BodyMetricLog[];
  stats: BodyMetricOverviewStats;
}

export function BodyMetricTrendPanel({
  logs,
  stats,
}: BodyMetricTrendPanelProps): JSX.Element {
  const trendPoints = calculateBodyMetricTrend(logs);
  const maxWeight = Math.max(...trendPoints.map((point) => point.weightKg ?? 0), 1);

  return (
    <Card
      title="Trend"
      subtitle="Latest 7 entries, oldest to newest."
    >
      {trendPoints.length === 0 ? (
        <EmptyState
          title="No trend yet"
          description="Save body metrics to build a simple local trend view."
        />
      ) : (
        <div className="body-metric-trend">
          <div className="body-metric-trend__labels">
            <span>Weight trend: {getTrendLabel(stats.weightChangeFromPrevious)}</span>
            <span>Body fat trend: {getTrendLabel(stats.bodyFatChangeFromPrevious)}</span>
            <span>Waist trend: {getTrendLabel(stats.waistChangeFromPrevious)}</span>
          </div>

          <div className="body-metric-trend__list">
            {trendPoints.map((point) => (
              <article className="body-metric-trend__row" key={point.id}>
                <div className="body-metric-trend__date">{formatDate(point.date)}</div>
                <div className="body-metric-trend__bar">
                  <span
                    style={{
                      width: `${Math.max(
                        8,
                        ((point.weightKg ?? 0) / maxWeight) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="body-metric-trend__metrics">
                  <span>{formatNullable(point.weightKg, "kg")}</span>
                  <span>BMI {formatNullable(point.bmi, "")}</span>
                  <span>Fat {formatNullable(point.bodyFatPercent, "%")}</span>
                  <span>Waist {formatNullable(point.waistCm, "cm")}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function getTrendLabel(change: number | null): string {
  if (change === null || Math.abs(change) < 0.1) {
    return "Stable";
  }

  return change > 0 ? "Up" : "Down";
}

function formatDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatNullable(value: number | null, unit: string): string {
  if (value === null) {
    return "--";
  }

  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}
