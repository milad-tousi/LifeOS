import { Card } from "@/components/common/Card";
import { getCategoryById } from "@/features/finance/finance.utils";
import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceCurrency,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface FinanceAnalyticsTabProps {
  analytics: FinanceAnalyticsSummary;
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
}

export function FinanceAnalyticsTab({
  analytics,
  budgetUsage,
  categories,
  currency,
}: FinanceAnalyticsTabProps): JSX.Element {
  const topExpenseCategory = analytics.topExpenseCategoryId
    ? getCategoryById(categories, analytics.topExpenseCategoryId)
    : undefined;

  const items = [
    {
      label: "Total income",
      value: formatMoney(analytics.totalIncome, currency),
    },
    {
      label: "Total expenses",
      value: formatMoney(analytics.totalExpenses, currency),
    },
    {
      label: "Net savings",
      value: formatMoney(analytics.netSavings, currency),
    },
    {
      label: "Top expense category",
      value: topExpenseCategory
        ? `${topExpenseCategory.name} (${formatMoney(analytics.topExpenseCategoryTotal, currency)})`
        : "No expense data yet",
    },
    {
      label: "Transactions",
      value: String(analytics.transactionCount),
    },
    {
      label: "Budget usage",
      value:
        budgetUsage.length > 0
          ? `${analytics.overBudgetCategories} of ${analytics.budgetedCategories} need attention`
          : "No budgets configured",
    },
    {
      label: "Recurring monthly income",
      value: formatMoney(analytics.recurringMonthlyIncome, currency),
    },
    {
      label: "Recurring monthly expenses",
      value: formatMoney(analytics.recurringMonthlyExpenses, currency),
    },
    {
      label: "Estimated recurring net",
      value: formatMoney(analytics.recurringMonthlyNet, currency),
    },
  ] as const;

  return (
    <div className="finance-tab-panel">
      <Card
        subtitle="A simple snapshot of real finance activity until deeper charts and trends arrive."
        title="Analytics"
      >
        <div className="finance-analytics-placeholder">
          <div className="finance-analytics-placeholder__hero">
            <div>
              <h3 className="finance-analytics-placeholder__title">
                Your finance activity is now summarized from real transactions.
              </h3>
              <p className="finance-analytics-placeholder__description">
                This placeholder keeps the analytics tab useful today while leaving room for charts, trends, and forecasting later. Recurring values are simple monthly estimates.
              </p>
            </div>
          </div>

          <div className="finance-analytics-stats">
            {items.map((item) => (
              <article className="finance-analytics-stats__card" key={item.label}>
                <span className="finance-analytics-stats__label">{item.label}</span>
                <strong className="finance-analytics-stats__value">{item.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
