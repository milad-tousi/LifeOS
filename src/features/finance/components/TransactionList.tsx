import { Pencil, Trash2 } from "lucide-react";
import { FinanceEmptyState } from "@/features/finance/components/FinanceEmptyState";
import { getFinanceIcon } from "@/features/finance/finance.icons";
import { FinanceCategory, FinanceCurrency, FinanceTransaction } from "@/features/finance/types/finance.types";
import { getTransactionCategory } from "@/features/finance/utils/finance.filters";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface TransactionListProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  onClearFilters: () => void;
  onDelete: (transaction: FinanceTransaction) => void;
  onEdit: (transaction: FinanceTransaction) => void;
  transactions: FinanceTransaction[];
  hasActiveFilters: boolean;
}

export function TransactionList({
  categories,
  currency,
  hasActiveFilters,
  onClearFilters,
  onDelete,
  onEdit,
  transactions,
}: TransactionListProps): JSX.Element {
  if (transactions.length === 0) {
    if (hasActiveFilters) {
      return (
        <FinanceEmptyState
          actionLabel="Clear filters"
          description="Try adjusting your search or clearing filters."
          onAction={onClearFilters}
          title="No matching transactions"
        />
      );
    }

    return (
      <FinanceEmptyState
        description="Add your first income or expense to start tracking your finances."
        title="No transactions yet"
      />
    );
  }

  return (
    <div className="finance-transactions finance-transactions--manager">
      {transactions.map((transaction) => {
        const category = getTransactionCategory(transaction, categories);
        const CategoryIcon = getFinanceIcon(category?.icon ?? "other");

        return (
          <article className="finance-transaction-card finance-transaction-card--managed" key={transaction.id}>
            <div className="finance-transaction-card__topline">
              <div className="finance-transaction-card__identity">
                <span
                  className={`finance-transaction-card__type finance-transaction-card__type--${transaction.type}`}
                >
                  {transaction.type === "income" ? "Income" : "Expense"}
                </span>
                {transaction.recurringId ? (
                  <span className="finance-transaction-card__chip finance-transaction-card__chip--recurring">
                    Recurring
                  </span>
                ) : null}
                <strong className="finance-transaction-card__merchant">{transaction.merchant}</strong>
                {transaction.note ? (
                  <p className="finance-transaction-card__note">{transaction.note}</p>
                ) : null}
              </div>

              <div className="finance-transaction-card__side">
                <strong
                  className={`finance-transaction-card__amount finance-transaction-card__amount--${transaction.type}`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatMoney(transaction.amount, currency)}
                </strong>
                <div className="finance-transaction-card__actions">
                  <button
                    aria-label={`Edit ${transaction.merchant}`}
                    className="icon-button finance-transaction-card__action"
                    onClick={() => onEdit(transaction)}
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Delete ${transaction.merchant}`}
                    className="icon-button finance-transaction-card__action"
                    onClick={() => onDelete(transaction)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="finance-transaction-card__meta">
              <span
                className="finance-transaction-card__chip finance-transaction-card__chip--category"
                style={{
                  backgroundColor: `${category?.color ?? "#64748b"}20`,
                  color: category?.color ?? "#334155",
                }}
              >
                <CategoryIcon size={13} />
                {category?.name ?? "Unknown category"}
              </span>
              <span className="finance-transaction-card__chip">{formatDate(transaction.date)}</span>
            </div>
          </article>
        );
      })}
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
