import { Card } from "@/components/common/Card";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { FilteredTransactionSummary } from "@/features/finance/utils/finance.filters";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface TransactionSummaryProps {
  currency: FinanceCurrency;
  summary: FilteredTransactionSummary;
}

export function TransactionSummary({
  currency,
  summary,
}: TransactionSummaryProps): JSX.Element {
  const { t } = useI18n();
  const items = [
    { label: t("finance.filteredIncome"), value: formatMoney(summary.income, currency), tone: "income" },
    { label: t("finance.filteredExpenses"), value: formatMoney(summary.expenses, currency), tone: "expense" },
    { label: t("finance.filteredNetTotal"), value: formatMoney(summary.netTotal, currency), tone: "balance" },
    { label: t("finance.transactions"), value: String(summary.transactionCount), tone: "neutral" },
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
