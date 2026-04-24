import { FinanceCategory, FinanceTransaction } from "@/features/finance/types/finance.types";

export interface MonthlyBudgetUsage {
  budgetAmount: number;
  category: FinanceCategory;
  percentageUsed: number;
  remainingAmount: number;
  spentAmount: number;
}

export function getMonthlyBudgetUsage(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  monthDate = new Date(),
): MonthlyBudgetUsage[] {
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();

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
            isSameMonth(transaction.date, month, year),
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

function isSameMonth(dateValue: string, month: number, year: number): boolean {
  const safeDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return false;
  }

  return safeDate.getMonth() === month && safeDate.getFullYear() === year;
}
