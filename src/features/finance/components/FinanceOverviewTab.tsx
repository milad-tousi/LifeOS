import { Card } from "@/components/common/Card";
import { FinanceSummaryCards } from "@/features/finance/components/FinanceSummaryCards";
import { FinanceTransactionsList } from "@/features/finance/components/FinanceTransactionsList";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceSummary,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";

interface FinanceOverviewTabProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export function FinanceOverviewTab({
  categories,
  currency,
  summary,
  transactions,
}: FinanceOverviewTabProps): JSX.Element {
  return (
    <div className="finance-tab-panel">
      <FinanceSummaryCards currency={currency} summary={summary} />

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
