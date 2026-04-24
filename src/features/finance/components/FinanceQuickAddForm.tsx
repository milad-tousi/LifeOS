import { Card } from "@/components/common/Card";
import { TransactionForm, TransactionFormValue } from "@/features/finance/components/TransactionForm";
import {
  FinanceCategory,
  FinanceMerchantRule,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { createId } from "@/lib/id";

interface FinanceQuickAddFormProps {
  categories: FinanceCategory[];
  merchantRules: FinanceMerchantRule[];
  onAddTransaction: (transaction: FinanceTransaction) => void;
}

export function FinanceQuickAddForm({
  categories,
  merchantRules,
  onAddTransaction,
}: FinanceQuickAddFormProps): JSX.Element {
  function handleSubmit(value: TransactionFormValue): void {
    onAddTransaction({
      id: createId(),
      createdAt: new Date().toISOString(),
      ...value,
    });
  }

  return (
    <Card
      subtitle="Add manual transactions now. Merchant mapping can suggest the right type and category as you type."
      title="Quick Add Transaction"
    >
      <div className="finance-form-shell">
        <TransactionForm
          categories={categories}
          merchantRules={merchantRules}
          mode="create"
          onSubmit={handleSubmit}
        />
      </div>
    </Card>
  );
}
