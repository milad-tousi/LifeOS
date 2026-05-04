import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { FinanceEmptyState } from "@/features/finance/components/FinanceEmptyState";
import { getFinanceIcon } from "@/features/finance/finance.icons";
import { getCategoryById } from "@/features/finance/finance.utils";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { getFinanceCategoryDisplayName, getFinanceTypeDisplayName } from "@/features/finance/utils/finance.i18n";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { formatAppDate } from "@/i18n/formatters";
import { useI18n } from "@/i18n";

interface FinanceTransactionsListProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  emptyDescription?: string;
  emptyTitle?: string;
  isEmbedded?: boolean;
  maxItems?: number;
  transactions: FinanceTransaction[];
}

export function FinanceTransactionsList({
  categories,
  currency,
  emptyDescription,
  emptyTitle,
  isEmbedded = false,
  maxItems,
  transactions,
}: FinanceTransactionsListProps): JSX.Element {
  const { language, t } = useI18n();
  const visibleTransactions = maxItems ? transactions.slice(0, maxItems) : transactions;

  if (transactions.length === 0) {
    return (
      <FinanceEmptyState
        description={emptyDescription ?? t("finance.noTransactionsDescription")}
        title={emptyTitle ?? t("finance.noTransactionsYet")}
      />
    );
  }

  return (
    <div className={`finance-transactions${isEmbedded ? " finance-transactions--embedded" : ""}`}>
      {visibleTransactions.map((transaction) => {
        const category = getCategoryById(categories, transaction.categoryId);
        const CategoryIcon = getFinanceIcon(category?.icon ?? "other");

        return (
          <article className="finance-transaction-card" key={transaction.id}>
            <div className="finance-transaction-card__topline">
              <div className="finance-transaction-card__identity">
                <span
                  className={`finance-transaction-card__type finance-transaction-card__type--${transaction.type}`}
                >
                  {transaction.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {getFinanceTypeDisplayName(transaction.type, t)}
                </span>
                {transaction.recurringId ? (
                  <span className="finance-transaction-card__chip finance-transaction-card__chip--recurring">
                    {t("finance.recurring.badge")}
                  </span>
                ) : null}
                {transaction.appliedSmartRuleName ? (
                  <span className="finance-transaction-card__chip">
                    {t("finance.rulePrefix")} {transaction.appliedSmartRuleName}
                  </span>
                ) : null}
                <strong className="finance-transaction-card__merchant">
                  {transaction.merchant}
                </strong>
              </div>
              <strong
                className={`finance-transaction-card__amount finance-transaction-card__amount--${transaction.type}`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatMoney(transaction.amount, currency)}
              </strong>
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
                {getFinanceCategoryDisplayName(category, t)}
              </span>
              <span className="finance-transaction-card__chip">{formatDate(transaction.date, language)}</span>
            </div>

            {transaction.note ? (
              <p className="finance-transaction-card__note">{transaction.note}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function formatDate(dateValue: string, language: "en" | "fa"): string {
  const safeDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return dateValue;
  }

  return formatAppDate(safeDate, language);
}
