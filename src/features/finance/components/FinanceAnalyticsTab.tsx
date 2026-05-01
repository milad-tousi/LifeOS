import { FinanceAnalyticsDashboard } from "@/features/finance/components/FinanceAnalyticsDashboard";
import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";

interface FinanceAnalyticsTabProps {
  analytics: FinanceAnalyticsSummary;
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  transactions: FinanceTransaction[];
}

export function FinanceAnalyticsTab({
  categories,
  currency,
  transactions,
}: FinanceAnalyticsTabProps): JSX.Element {
  return (
    <div className="finance-tab-panel">
      <FinanceAnalyticsDashboard
        categories={categories}
        currency={currency}
        transactions={transactions}
      />
    </div>
  );
}
