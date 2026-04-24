import { BudgetOverview } from "@/features/finance/components/BudgetOverview";
import { FinanceInsights } from "@/features/finance/components/FinanceInsights";
import { Card } from "@/components/common/Card";
import { FinanceSummaryCards } from "@/features/finance/components/FinanceSummaryCards";
import { FinanceTransactionsList } from "@/features/finance/components/FinanceTransactionsList";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceSummary,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";

interface FinanceOverviewTabProps {
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  insights: string[];
  onOpenSettings: () => void;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export function FinanceOverviewTab({
  budgetUsage,
  categories,
  currency,
  insights,
  onOpenSettings,
  summary,
  transactions,
}: FinanceOverviewTabProps): JSX.Element {
  return (
    <div className="finance-tab-panel">
      <FinanceSummaryCards currency={currency} summary={summary} />
      <BudgetOverview
        budgetUsage={budgetUsage}
        currency={currency}
        onOpenSettings={onOpenSettings}
      />
      <FinanceInsights insights={insights} />

      <Card
        subtitle="A lighter snapshot of your latest activity so you can check momentum without dropping into data entry."
        title="Recent Activity"
      >
        <FinanceTransactionsList
          categories={categories}
          currency={currency}
          emptyTitle="No recent transactions yet"
          emptyDescription="Recent finance activity will appear here as you start adding entries."
          isEmbedded
          maxItems={4}
          transactions={transactions}
        />
      </Card>
    </div>
  );
}
