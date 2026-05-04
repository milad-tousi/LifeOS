import { Card } from "@/components/common/Card";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { FinanceLegacyInsight } from "@/features/finance/utils/finance.insights";
import { FinanceInsightItem } from "@/features/finance/utils/calculateFinanceAnalytics";
import { getFinanceCategoryDisplayName } from "@/features/finance/utils/finance.i18n";
import { getCurrencySymbol } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface FinanceInsightsProps {
  currency?: FinanceCurrency;
  insights?: FinanceLegacyInsight[];
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
                  {getInsightValue(insight, currency, t)}
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
          <article className="finance-insight-card" key={`${insight.id}-${JSON.stringify(insight.values ?? {})}`}>
            <p>{translateLegacyInsight(insight, t)}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}

function getInsightTitle(insight: FinanceInsightItem, t: (key: string) => string): string {
  if (insight.id === "net-savings") {
    if (insight.title === "Cashflow gap") {
      return t("finance.insight.net-savings.titleNegative");
    }

    return t("finance.insight.net-savings.title");
  }

  const key = `finance.insight.${insight.id}.title`;
  const translated = t(key);
  return translated === key ? insight.title : translated;
}

function getInsightValue(
  insight: FinanceInsightItem,
  currency: FinanceCurrency | undefined,
  t: (key: string) => string,
): string {
  if (insight.id === "average-daily-spending" && currency) {
    return `${getCurrencySymbol(currency)}${insight.value}`;
  }

  if (insight.id === "largest-expense-category") {
    return translateDefaultCategoryName(insight.value, t);
  }

  if (insight.id === "top-budget-usage") {
    const category = insight.detailValues?.category;

    if (category) {
      return insight.value.replace(category, translateDefaultCategoryName(category, t));
    }
  }

  if (insight.id === "budget-attention" && insight.value === "No budget needs attention") {
    return t("finance.insight.budget-attention.valueHealthy");
  }

  return insight.value;
}

function getInsightDetail(insight: FinanceInsightItem, t: (key: string) => string): string {
  if (insight.id === "net-savings") {
    const key =
      insight.title === "Cashflow gap"
        ? "finance.insight.net-savings.detailNegative"
        : "finance.insight.net-savings.detail";

    return applyTemplateValues(t(key), normalizeInsightValues(insight, t));
  }

  if (insight.id === "top-budget-usage") {
    const key =
      insight.detail.includes("over budget")
        ? "finance.insight.top-budget-usage.detailOver"
        : "finance.insight.top-budget-usage.detail";

    return applyTemplateValues(t(key), normalizeInsightValues(insight, t));
  }

  if (insight.id === "budget-attention") {
    const key =
      insight.value === "No budget needs attention"
        ? "finance.insight.budget-attention.detailHealthy"
        : "finance.insight.budget-attention.detail";

    return applyTemplateValues(t(key), normalizeInsightValues(insight, t));
  }

  const key = `finance.insight.${insight.id}.detail`;
  const translated = t(key);
  if (translated === key) {
    return insight.detail;
  }

  return applyTemplateValues(
    translated,
    normalizeInsightValues(insight, t),
  );
}

function normalizeInsightValues(
  insight: FinanceInsightItem,
  t: (key: string) => string,
): Record<string, string> {
  const detailValues = insight.detailValues ?? {};

  return Object.fromEntries(
    Object.entries(detailValues).map(([key, value]) => [
      key,
      key === "category"
        ? translateDefaultCategoryName(value, t)
        : key === "warnings"
          ? translateWarningsSummary(value, t)
          : value,
    ]),
  );
}

function translateDefaultCategoryName(
  name: string,
  t: (key: string) => string,
): string {
  return getFinanceCategoryDisplayName(
    {
      id: name.trim().toLowerCase(),
      name,
      type: "expense",
      icon: name.trim().toLowerCase(),
      color: "#000000",
    } satisfies FinanceCategory,
    t,
  );
}

function applyTemplateValues(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function translateWarningsSummary(value: string, t: (key: string) => string): string {
  return value
    .split(", ")
    .map((entry) => {
      const match = entry.match(/^(.*) by (.+)$/);

      if (!match) {
        return entry;
      }

      const [, category, amount] = match;
      return t("finance.insight.budget-attention.warningItem")
        .replace("{category}", translateDefaultCategoryName(category, t))
        .replace("{amount}", amount);
    })
    .join("، ");
}

function translateLegacyInsight(insight: FinanceLegacyInsight, t: (key: string) => string): string {
  switch (insight.id) {
    case "add-first-transaction":
      return t("finance.legacy.addFirstTransaction");
    case "spent-this-month":
      return t("finance.legacy.spentThisMonth").replace("{amount}", insight.values?.amount ?? "");
    case "saved-this-month":
      return t("finance.legacy.savedThisMonth").replace("{amount}", insight.values?.amount ?? "");
    case "expenses-higher-than-income":
      return t("finance.legacy.expensesHigherThanIncome");
    case "highest-category":
      return t("finance.legacy.highestCategory").replace(
        "{category}",
        translateDefaultCategoryName(insight.values?.category ?? "", t),
      );
    case "close-to-budget":
      return t("finance.legacy.closeToBudget").replace(
        "{category}",
        translateDefaultCategoryName(insight.values?.category ?? "", t),
      );
    default:
      return "";
  }
}
