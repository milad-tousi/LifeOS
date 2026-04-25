import { Card } from "@/components/common/Card";
import { InsightEmptyState } from "@/features/health/components/InsightEmptyState";
import { HealthInsight } from "@/features/health/types/health.types";

interface HealthInsightListProps {
  insights: HealthInsight[];
}

export function HealthInsightList({ insights }: HealthInsightListProps): JSX.Element {
  return (
    <Card title="Insight Cards" subtitle="Deterministic patterns from your local logs.">
      {insights.length === 0 ? (
        <InsightEmptyState />
      ) : (
        <div className="health-insight-list">
          {insights.map((insight) => (
            <article
              className={`health-insight-card health-insight-card--${insight.type.toLowerCase()}`}
              key={insight.id}
            >
              <div className="health-insight-card__top">
                <span className="health-insight-card__badge">{insight.type}</span>
                <span className="health-insight-card__confidence">
                  {insight.confidence} confidence
                </span>
              </div>
              <div className="health-insight-card__body">
                <h3>{insight.title}</h3>
                <p>{insight.summary}</p>
                <p>{insight.detail}</p>
              </div>
              <div className="health-insight-card__areas">
                {insight.relatedAreas.map((area) => (
                  <span key={area}>{area}</span>
                ))}
              </div>
              <div className="health-insight-card__action">
                <strong>Suggested action</strong>
                <span>{insight.suggestedAction}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
