import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { getFinanceIcon } from "@/features/finance/finance.icons";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage, getBudgetStatus } from "@/features/finance/utils/finance.budgets";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface BudgetOverviewProps {
  budgetUsage: MonthlyBudgetUsage[];
  currency: FinanceCurrency;
  onOpenSettings: () => void;
}

export function BudgetOverview({
  budgetUsage,
  currency,
  onOpenSettings,
}: BudgetOverviewProps): JSX.Element {
  return (
    <Card
      subtitle="Track this month's category budgets so you can see where spending is still comfortable and where it needs attention."
      title="Budget Overview"
    >
      {budgetUsage.length === 0 ? (
        <div className="finance-empty-inline">
          <strong>No budgets configured</strong>
          <p>Add monthly budgets to your expense categories in Finance Settings.</p>
          <Button onClick={onOpenSettings} type="button">
            Open Finance Settings
          </Button>
        </div>
      ) : (
        <div className="finance-budget-list">
          {budgetUsage.map((usage) => {
            const status = getBudgetStatus(usage.percentageUsed);
            const CategoryIcon = getFinanceIcon(usage.category.icon);

            return (
              <article className="finance-budget-card" key={usage.category.id}>
                <div className="finance-budget-card__header">
                  <div className="finance-category-badge">
                    <span
                      className="finance-category-badge__icon"
                      style={{
                        backgroundColor: `${usage.category.color}20`,
                        color: usage.category.color,
                      }}
                    >
                      <CategoryIcon size={16} />
                    </span>
                    <div className="finance-category-badge__copy">
                      <strong>{usage.category.name}</strong>
                      <span>{Math.round(usage.percentageUsed)}% used</span>
                    </div>
                  </div>
                  <span className={`finance-budget-card__status finance-budget-card__status--${status}`}>
                    {status}
                  </span>
                </div>
                <div className="finance-budget-card__meta">
                  <span>Spent {formatMoney(usage.spentAmount, currency)}</span>
                  <span>Budget {formatMoney(usage.budgetAmount, currency)}</span>
                  <span>Remaining {formatMoney(usage.remainingAmount, currency)}</span>
                </div>
                <div className="finance-budget-card__progress">
                  <div
                    className={`finance-budget-card__progress-bar finance-budget-card__progress-bar--${status}`}
                    style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
