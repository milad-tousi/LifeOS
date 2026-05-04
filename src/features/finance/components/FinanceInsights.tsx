import { Card } from "@/components/common/Card";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { FinanceInsightItem } from "@/features/finance/utils/calculateFinanceAnalytics";
import { getCurrencySymbol } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  if (analyticsInsights) {
    return (
      <section className="finance-dashboard-card finance-dashboard-card--wide">
        <div className="finance-dashboard-card__header">
          <div>
            <h3>{t("finance.smartInsights")}</h3>
            <p>{t("finance.smartInsightsDescription")}</p>
          </div>
        </div>
        {analyticsInsights.length > 0 ? (
          <div className="finance-smart-insights">
            {analyticsInsights.map((insight) => (
              <article
                className={`finance-smart-insight finance-smart-insight--${insight.tone}`}
                key={insight.id}
              >
                <span>{getInsightTitle(insight, t)}</span>
                <strong>
                  {insight.id === "average-daily-spending" && currency
                    ? `${getCurrencySymbol(currency)}${insight.value}`
                    : insight.value}
                </strong>
                <p>{getInsightDetail(insight, t)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="finance-chart-empty">
            <strong>{t("finance.noInsights")}</strong>
            <p>{t("finance.noInsightsDescription")}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <Card
      subtitle={t("finance.insightsDescription")}
      title={t("finance.insights")}
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

function getInsightTitle(insight: FinanceInsightItem, t: (key: string) => string): string {
  const key = `finance.insight.${insight.id}.title`;
  const translated = t(key);
  return translated === key ? insight.title : translated;
}

function getInsightDetail(insight: FinanceInsightItem, t: (key: string) => string): string {
  const key = `finance.insight.${insight.id}.detail`;
  const translated = t(key);
  return translated === key ? insight.detail : translated;
}
