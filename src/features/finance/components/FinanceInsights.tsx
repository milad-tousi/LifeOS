import { Card } from "@/components/common/Card";

interface FinanceInsightsProps {
  insights: string[];
}

export function FinanceInsights({ insights }: FinanceInsightsProps): JSX.Element {
  return (
    <Card
      subtitle="Deterministic local insights based on your current finance activity."
      title="Insights"
    >
      <div className="finance-insights-list">
        {insights.map((insight) => (
          <article className="finance-insight-card" key={insight}>
            <p>{insight}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}
