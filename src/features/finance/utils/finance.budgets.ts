import { FinanceCategory, FinanceTransaction } from "@/features/finance/types/finance.types";
import {
  getCurrentFinanceCycle,
  isInCycleRange,
} from "@/features/finance/utils/financeCycle.utils";

export interface MonthlyBudgetUsage {
  budgetAmount: number;
  category: FinanceCategory;
  percentageUsed: number;
  remainingAmount: number;
  spentAmount: number;
}

/**
 * Calculates budget usage for each category with a monthly budget,
 * scoped to the current finance cycle (derived from cycleStartDay).
 *
 * @param transactions All transactions
 * @param categories   All categories
 * @param cycleStartDay  Day of month the cycle begins (1–28, default 1)
 */
export function getMonthlyBudgetUsage(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  cycleStartDay = 1,
): MonthlyBudgetUsage[] {
  const cycle = getCurrentFinanceCycle(cycleStartDay);

  return categories
    .filter(
      (category) =>
        category.type !== "income" &&
        typeof category.monthlyBudget === "number" &&
        category.monthlyBudget > 0,
    )
    .map((category) => {
      const spentAmount = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.categoryId === category.id &&
            isInCycleRange(transaction.date, cycle.startDate, cycle.endDate),
        )
        .reduce((total, transaction) => total + transaction.amount, 0);

      const budgetAmount = category.monthlyBudget ?? 0;

      return {
        category,
        spentAmount,
        budgetAmount,
        remainingAmount: budgetAmount - spentAmount,
        percentageUsed: budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0,
      };
    });
}

export function getBudgetStatus(
  percentage: number,
): "safe" | "warning" | "danger" {
  if (percentage >= 90) {
    return "danger";
  }

  if (percentage >= 70) {
    return "warning";
  }

  return "safe";
}
