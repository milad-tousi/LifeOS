import { Card } from "@/components/common/Card";
import { HealthDataCoverage } from "@/features/health/types/health.types";

interface DataCoveragePanelProps {
  coverage: HealthDataCoverage;
}

export function DataCoveragePanel({ coverage }: DataCoveragePanelProps): JSX.Element {
  const rows = [
    { label: "Health logs", count: coverage.healthLogsCount },
    { label: "Body metrics", count: coverage.bodyMetricsCount },
    { label: "Workouts", count: coverage.workoutLogsCount },
    { label: "Nutrition", count: coverage.nutritionMealsCount },
    { label: "Recovery", count: coverage.recoveryCheckInsCount },
  ];

  return (
    <Card
      title="Data Coverage"
      subtitle="Insights become more useful after at least 3 logs per area in the last 14 days."
    >
      <div className="data-coverage-panel">
        <div className="data-coverage-panel__score">
          <strong>{coverage.coverageScore}/100</strong>
          <span>Coverage score</span>
        </div>
        <div className="data-coverage-panel__rows">
          {rows.map((row) => (
            <div className="data-coverage-row" key={row.label}>
              <div>
                <strong>{row.label}</strong>
                <span>{row.count} recent logs</span>
              </div>
              <div className="data-coverage-row__bar">
                <span style={{ width: `${getAreaProgress(row.count)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="data-coverage-panel__missing">
          <strong>Missing areas</strong>
          <span>
            {coverage.missingAreas.length > 0
              ? coverage.missingAreas.join(", ")
              : "No missing areas"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function getAreaProgress(count: number): number {
  if (count >= 3) {
    return 100;
  }

  if (count >= 1) {
    return 50;
  }

  return 0;
}
