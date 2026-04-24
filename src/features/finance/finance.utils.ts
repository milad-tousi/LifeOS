import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceMerchantRule,
  FinanceSummary,
  FinanceTransaction,
  RecurringTransaction,
  TransactionType,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";

export function calculateFinanceSummary(
  transactions: FinanceTransaction[],
  now = new Date(),
): FinanceSummary {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        isSameMonth(transaction.date, currentMonth, currentYear),
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const monthlyExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        isSameMonth(transaction.date, currentMonth, currentYear),
    )
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalBalance = transactions.reduce(
    (total, transaction) =>
      total + (transaction.type === "income" ? transaction.amount : -transaction.amount),
    0,
  );

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
  };
}

export function calculateFinanceAnalytics(
  transactions: FinanceTransaction[],
  budgetUsage: MonthlyBudgetUsage[] = [],
  recurringTransactions: RecurringTransaction[] = [],
): FinanceAnalyticsSummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  const expenseCategoryTotals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
      continue;
    }

    totalExpenses += transaction.amount;
    expenseCategoryTotals.set(
      transaction.categoryId,
      (expenseCategoryTotals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  let topExpenseCategoryId: string | undefined;
  let topExpenseCategoryTotal = 0;

  for (const [categoryId, total] of expenseCategoryTotals.entries()) {
    if (total > topExpenseCategoryTotal) {
      topExpenseCategoryId = categoryId;
      topExpenseCategoryTotal = total;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netSavings: totalIncome - totalExpenses,
    topExpenseCategoryId,
    topExpenseCategoryTotal,
    transactionCount: transactions.length,
    budgetedCategories: budgetUsage.length,
    overBudgetCategories: budgetUsage.filter((usage) => usage.percentageUsed >= 90).length,
    recurringMonthlyIncome: getRecurringMonthlyEstimate(recurringTransactions, "income"),
    recurringMonthlyExpenses: getRecurringMonthlyEstimate(recurringTransactions, "expense"),
    recurringMonthlyNet:
      getRecurringMonthlyEstimate(recurringTransactions, "income") -
      getRecurringMonthlyEstimate(recurringTransactions, "expense"),
  };
}

export function sortTransactionsByDate(
  transactions: FinanceTransaction[],
): FinanceTransaction[] {
  return [...transactions].sort((left, right) => {
    const dateComparison = right.date.localeCompare(left.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function getCategoriesForType(
  categories: FinanceCategory[],
  type: TransactionType,
): FinanceCategory[] {
  return categories.filter(
    (category) => category.type === type || category.type === "both",
  );
}

export function findMerchantRuleMatch(
  merchantRules: FinanceMerchantRule[],
  merchantName: string,
): FinanceMerchantRule | null {
  const normalizedMerchantName = merchantName.trim().toLowerCase();

  if (!normalizedMerchantName) {
    return null;
  }

  const sortedRules = [...merchantRules].sort((left, right) => right.name.length - left.name.length);

  return (
    sortedRules.find((merchantRule) =>
      normalizedMerchantName.includes(merchantRule.name.trim().toLowerCase()),
    ) ?? null
  );
}

export function getCategoryById(
  categories: FinanceCategory[],
  categoryId: string,
): FinanceCategory | undefined {
  return categories.find((category) => category.id === categoryId);
}

function isSameMonth(dateValue: string, month: number, year: number): boolean {
  const safeDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return false;
  }

  return safeDate.getMonth() === month && safeDate.getFullYear() === year;
}

function getRecurringMonthlyEstimate(
  recurringTransactions: RecurringTransaction[],
  type: TransactionType,
): number {
  return recurringTransactions
    .filter((transaction) => transaction.isActive && transaction.type === type)
    .reduce((total, transaction) => {
      switch (transaction.repeat) {
        case "daily":
          return total + transaction.amount * 30;
        case "weekly":
          return total + transaction.amount * 4;
        case "monthly":
          return total + transaction.amount;
        case "yearly":
          return total + transaction.amount / 12;
        default:
          return total;
      }
    }, 0);
}
