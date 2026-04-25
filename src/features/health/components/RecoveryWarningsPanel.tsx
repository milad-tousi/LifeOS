import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ReadinessResult } from "@/features/health/types/health.types";

interface RecoveryWarningsPanelProps {
  readiness: ReadinessResult | null;
}

export function RecoveryWarningsPanel({
  readiness,
}: RecoveryWarningsPanelProps): JSX.Element {
  return (
    <Card title="Recovery Warnings" subtitle="Simple wellness flags from local data.">
      {!readiness ? (
        <EmptyState
          title="No recovery warnings today"
          description="Save a recovery check-in to evaluate today's signals."
        />
      ) : readiness.warnings.length === 0 ? (
        <EmptyState
          title="No recovery warnings today."
          description={`${readiness.suggestedActivity} looks reasonable if you feel good.`}
        />
      ) : (
        <div className="recovery-warnings">
          <div className="recovery-warnings__list">
            {readiness.warnings.map((warning) => (
              <span className="recovery-warning-chip" key={warning}>
                {warning}
              </span>
            ))}
          </div>
          <div className="recovery-recommendation">
            <strong>{readiness.recommendationTitle}</strong>
            <p>{readiness.recommendationText}</p>
            <span>Suggested activity: {readiness.suggestedActivity}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
