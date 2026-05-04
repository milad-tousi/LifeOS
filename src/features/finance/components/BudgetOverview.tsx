import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { getFinanceIcon } from "@/features/finance/finance.icons";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage, getBudgetStatus } from "@/features/finance/utils/finance.budgets";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { getFinanceCategoryDisplayName } from "@/features/finance/utils/finance.i18n";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  return (
    <Card
      subtitle={t("finance.budgetOverviewDescription")}
      title={t("finance.budgetOverview")}
    >
      {budgetUsage.length === 0 ? (
        <div className="finance-empty-inline">
          <strong>{t("finance.noBudgetsConfigured")}</strong>
          <p>{t("finance.noBudgetsDescription")}</p>
          <Button onClick={onOpenSettings} type="button">
            {t("finance.openFinanceSettings")}
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
                      <strong>{getFinanceCategoryDisplayName(usage.category, t)}</strong>
                      <span>{t("finance.usedPercent").replace("{value}", String(Math.round(usage.percentageUsed)))}</span>
                    </div>
                  </div>
                  <span className={`finance-budget-card__status finance-budget-card__status--${status}`}>
                    {t(`finance.budgetStatus.${status}`)}
                  </span>
                </div>
                <div className="finance-budget-card__meta">
                  <span>{t("finance.spent")} {formatMoney(usage.spentAmount, currency)}</span>
                  <span>{t("finance.budget")} {formatMoney(usage.budgetAmount, currency)}</span>
                  <span>{t("finance.remaining")} {formatMoney(usage.remainingAmount, currency)}</span>
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
