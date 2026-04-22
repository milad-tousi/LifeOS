import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { FinanceEmptyState } from "@/features/finance/components/FinanceEmptyState";
import { FinanceTransaction } from "@/features/finance/types";
import { formatCurrency } from "@/lib/number";

interface FinanceTransactionsListProps {
  emptyDescription?: string;
  emptyTitle?: string;
  isEmbedded?: boolean;
  maxItems?: number;
  transactions: FinanceTransaction[];
}

export function FinanceTransactionsList({
  emptyDescription = "Add your first income or expense to start building your finance history.",
  emptyTitle = "No transactions yet",
  isEmbedded = false,
  maxItems,
  transactions,
}: FinanceTransactionsListProps): JSX.Element {
  const visibleTransactions = maxItems ? transactions.slice(0, maxItems) : transactions;

  if (transactions.length === 0) {
    return <FinanceEmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className={`finance-transactions${isEmbedded ? " finance-transactions--embedded" : ""}`}>
      {visibleTransactions.map((transaction) => (
        <article className="finance-transaction-card" key={transaction.id}>
          <div className="finance-transaction-card__topline">
            <div className="finance-transaction-card__identity">
              <span
                className={`finance-transaction-card__type finance-transaction-card__type--${transaction.type}`}
              >
                {transaction.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {transaction.type === "income" ? "Income" : "Expense"}
              </span>
              <strong className="finance-transaction-card__merchant">
                {transaction.merchant}
              </strong>
            </div>
            <strong
              className={`finance-transaction-card__amount finance-transaction-card__amount--${transaction.type}`}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </strong>
          </div>

          <div className="finance-transaction-card__meta">
            <span className="finance-transaction-card__chip">{transaction.category}</span>
            <span className="finance-transaction-card__chip">{formatDate(transaction.date)}</span>
          </div>

          {transaction.note ? (
            <p className="finance-transaction-card__note">{transaction.note}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function formatDate(dateValue: string): string {
  const safeDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(safeDate);
}
