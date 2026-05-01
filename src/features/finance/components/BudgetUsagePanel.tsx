import { ChartEmptyState } from "@/features/finance/components/FinanceTrendChart";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { BudgetUsagePoint } from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface BudgetUsagePanelProps {
  budgetUsage: BudgetUsagePoint[];
  currency: FinanceCurrency;
}

export function BudgetUsagePanel({
  budgetUsage,
  currency,
}: BudgetUsagePanelProps): JSX.Element {
  return (
    <section className="finance-dashboard-card">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>Budget Usage</h3>
          <p>Monthly budget progress by expense category.</p>
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
                      {formatMoney(usage.spentAmount, currency)} of{" "}
                      {formatMoney(usage.budgetAmount, currency)}
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
                    ? `${formatMoney(usage.remainingAmount, currency)} remaining`
                    : `Over budget by ${formatMoney(Math.abs(usage.remainingAmount), currency)}`}
                </small>
              </article>
            );
          })}
        </div>
      ) : (
        <ChartEmptyState description="Add monthly budgets in Finance Settings to track usage." />
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
