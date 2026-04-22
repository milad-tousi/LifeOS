import { Card } from "@/components/common/Card";
import { FinanceSummaryCards } from "@/features/finance/components/FinanceSummaryCards";
import { FinanceTransactionsList } from "@/features/finance/components/FinanceTransactionsList";
import { FinanceSummary, FinanceTransaction } from "@/features/finance/types";

interface FinanceOverviewTabProps {
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export function FinanceOverviewTab({
  summary,
  transactions,
}: FinanceOverviewTabProps): JSX.Element {
  return (
    <div className="finance-tab-panel">
      <FinanceSummaryCards summary={summary} />

      <Card
        subtitle="A lighter snapshot of your latest activity so you can check momentum without dropping into data entry."
        title="Recent Activity"
      >
        <FinanceTransactionsList
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
