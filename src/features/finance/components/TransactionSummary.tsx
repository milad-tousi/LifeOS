import { Card } from "@/components/common/Card";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { FilteredTransactionSummary } from "@/features/finance/utils/finance.filters";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface TransactionSummaryProps {
  currency: FinanceCurrency;
  summary: FilteredTransactionSummary;
}

export function TransactionSummary({
  currency,
  summary,
}: TransactionSummaryProps): JSX.Element {
  const items = [
    { label: "Filtered income", value: formatMoney(summary.income, currency), tone: "income" },
    { label: "Filtered expenses", value: formatMoney(summary.expenses, currency), tone: "expense" },
    { label: "Filtered net total", value: formatMoney(summary.netTotal, currency), tone: "balance" },
    { label: "Transactions", value: String(summary.transactionCount), tone: "neutral" },
  ] as const;

  return (
    <div className="finance-transaction-summary">
      {items.map((item) => (
        <Card key={item.label}>
          <div className={`finance-transaction-summary__card finance-transaction-summary__card--${item.tone}`}>
            <span className="finance-transaction-summary__label">{item.label}</span>
            <strong className="finance-transaction-summary__value">{item.value}</strong>
          </div>
        </Card>
      ))}
    </div>
  );
}
