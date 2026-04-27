import { Card } from "@/components/common/Card";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { FinanceInsightItem } from "@/features/finance/utils/calculateFinanceAnalytics";
import { getCurrencySymbol } from "@/features/finance/utils/finance.format";

interface FinanceInsightsProps {
  currency?: FinanceCurrency;
  insights?: string[];
  analyticsInsights?: FinanceInsightItem[];
}

export function FinanceInsights({
  analyticsInsights,
  currency,
  insights = [],
}: FinanceInsightsProps): JSX.Element {
  if (analyticsInsights) {
    return (
      <section className="finance-dashboard-card finance-dashboard-card--wide">
        <div className="finance-dashboard-card__header">
          <div>
            <h3>Smart Insights</h3>
            <p>Deterministic local insights from your transaction and budget data.</p>
          </div>
        </div>
        {analyticsInsights.length > 0 ? (
          <div className="finance-smart-insights">
            {analyticsInsights.map((insight) => (
              <article
                className={`finance-smart-insight finance-smart-insight--${insight.tone}`}
                key={insight.id}
              >
                <span>{insight.title}</span>
                <strong>
                  {insight.id === "average-daily-spending" && currency
                    ? `${getCurrencySymbol(currency)}${insight.value}`
                    : insight.value}
                </strong>
                <p>{insight.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="finance-chart-empty">
            <strong>No insights yet</strong>
            <p>Add transactions and budgets to generate finance insights.</p>
          </div>
        )}
      </section>
    );
  }

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
