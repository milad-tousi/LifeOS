import { ChartEmptyState } from "@/features/finance/components/FinanceTrendChart";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { BudgetUsagePoint } from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface BudgetUsagePanelProps {
  budgetUsage: BudgetUsagePoint[];
  currency: FinanceCurrency;
}

export function BudgetUsagePanel({
  budgetUsage,
  currency,
}: BudgetUsagePanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="finance-dashboard-card">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>{t("finance.budgetUsage")}</h3>
          <p>{t("finance.budgetUsageDescription")}</p>
        </div>
      </div>

      {budgetUsage.length > 0 ? (
        <div className="finance-budget-usage">
          {budgetUsage.map((usage) => {
            const statusClass = getStatusClass(usage.status);
            return (
              <article className="finance-budget-usage__item" key={usage.categoryId}>
                <div className="finance-budget-usage__top">
                  <div>
                    <strong>{usage.categoryName}</strong>
                    <span>
                      {t("finance.amountOfTotal")
                        .replace("{amount}", formatMoney(usage.spentAmount, currency))
                        .replace("{total}", formatMoney(usage.budgetAmount, currency))}
                    </span>
                  </div>
                  <b className={`finance-budget-usage__badge finance-budget-usage__badge--${statusClass}`}>
                    {Math.round(usage.percentageUsed)}%
                  </b>
                </div>
                <div className="finance-budget-usage__track">
                  <div
                    className={`finance-budget-usage__bar finance-budget-usage__bar--${statusClass}`}
                    style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                  />
                </div>
                <small>
                  {usage.remainingAmount >= 0
                    ? t("finance.remainingAmount").replace("{amount}", formatMoney(usage.remainingAmount, currency))
                    : t("finance.overBudgetBy").replace("{amount}", formatMoney(Math.abs(usage.remainingAmount), currency))}
                </small>
              </article>
            );
          })}
        </div>
      ) : (
        <ChartEmptyState description={t("finance.budgetUsageEmpty")} />
      )}
    </section>
  );
}

function getStatusClass(status: BudgetUsagePoint["status"]): "safe" | "warning" | "danger" {
  if (status === "over") {
    return "danger";
  }

  if (status === "warning") {
    return "warning";
  }

  return "safe";
}
