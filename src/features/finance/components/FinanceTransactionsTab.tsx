import { Card } from "@/components/common/Card";
import { FinanceQuickAddForm } from "@/features/finance/components/FinanceQuickAddForm";
import { FinanceTransactionsList } from "@/features/finance/components/FinanceTransactionsList";
import { FinanceTransaction } from "@/features/finance/types";

interface FinanceTransactionsTabProps {
  onAddTransaction: (transaction: FinanceTransaction) => void;
  transactions: FinanceTransaction[];
}

export function FinanceTransactionsTab({
  onAddTransaction,
  transactions,
}: FinanceTransactionsTabProps): JSX.Element {
  return (
    <div className="finance-tab-panel">
      <FinanceQuickAddForm onAddTransaction={onAddTransaction} />
      <Card
        subtitle="All manual finance activity stays here for review until editing, filters, and rules are added in later phases."
        title="Recent Transactions"
      >
        <FinanceTransactionsList transactions={transactions} />
      </Card>
    </div>
  );
}
