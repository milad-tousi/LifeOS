import {
  FinanceCategory,
  FinanceTransaction,
  TransactionType,
} from "@/features/finance/types/finance.types";
import { getCategoryById, sortTransactionsByDate } from "@/features/finance/finance.utils";

export type FinanceTransactionSortOption =
  | "newest"
  | "oldest"
  | "amount-desc"
  | "amount-asc"
  | "merchant-asc"
  | "merchant-desc";

export interface FinanceTransactionFilters {
  type: "all" | TransactionType;
  categoryId: string;
  fromDate: string;
  maxAmount: string;
  minAmount: string;
  quickDate: "all" | "this-month" | "last-month" | "last-30-days" | "this-year";
  toDate: string;
}

export interface FilteredTransactionSummary {
  expenses: number;
  income: number;
  netTotal: number;
  transactionCount: number;
}

export function searchTransactions(
  transactions: FinanceTransaction[],
  query: string,
  categories: FinanceCategory[],
): FinanceTransaction[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return transactions;
  }

  return transactions.filter((transaction) => {
    const categoryName = getTransactionCategory(transaction, categories)?.name ?? "";

    return [
      transaction.merchant,
      transaction.note ?? "",
      categoryName,
      transaction.type,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function filterTransactions(
  transactions: FinanceTransaction[],
  filters: FinanceTransactionFilters,
): FinanceTransaction[] {
  const minAmount = Number(filters.minAmount);
  const maxAmount = Number(filters.maxAmount);
  const hasValidMinAmount = Number.isFinite(minAmount) && filters.minAmount.trim() !== "";
  const hasValidMaxAmount = Number.isFinite(maxAmount) && filters.maxAmount.trim() !== "";
  const shouldIgnoreAmountRange =
    hasValidMinAmount && hasValidMaxAmount && minAmount > maxAmount;

  return transactions.filter((transaction) => {
    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }

    if (filters.fromDate && transaction.date < filters.fromDate) {
      return false;
    }

    if (filters.toDate && transaction.date > filters.toDate) {
      return false;
    }

    if (!shouldIgnoreAmountRange && hasValidMinAmount && transaction.amount < minAmount) {
      return false;
    }

    if (!shouldIgnoreAmountRange && hasValidMaxAmount && transaction.amount > maxAmount) {
      return false;
    }

    return true;
  });
}

export function sortTransactions(
  transactions: FinanceTransaction[],
  sortOption: FinanceTransactionSortOption,
): FinanceTransaction[] {
  switch (sortOption) {
    case "oldest":
      return [...sortTransactionsByDate(transactions)].reverse();
    case "amount-desc":
      return [...transactions].sort((left, right) => right.amount - left.amount);
    case "amount-asc":
      return [...transactions].sort((left, right) => left.amount - right.amount);
    case "merchant-asc":
      return [...transactions].sort((left, right) =>
        left.merchant.localeCompare(right.merchant),
      );
    case "merchant-desc":
      return [...transactions].sort((left, right) =>
        right.merchant.localeCompare(left.merchant),
      );
    case "newest":
    default:
      return sortTransactionsByDate(transactions);
  }
}

export function getTransactionCategory(
  transaction: FinanceTransaction,
  categories: FinanceCategory[],
): FinanceCategory | undefined {
  return getCategoryById(categories, transaction.categoryId);
}

export function getFilteredTransactionSummary(
  transactions: FinanceTransaction[],
): FilteredTransactionSummary {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    income,
    expenses,
    netTotal: income - expenses,
    transactionCount: transactions.length,
  };
}
