import { FinanceCategory, FinanceSummary } from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage, getBudgetStatus } from "@/features/finance/utils/finance.budgets";
import { formatMoney } from "@/features/finance/utils/finance.format";

export function getFinanceInsights(params: {
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: "EUR" | "USD" | "GBP" | "IRR";
  hasTransactions: boolean;
  summary: FinanceSummary;
  topExpenseCategoryId?: string;
}): string[] {
  const {
    budgetUsage,
    categories,
    currency,
    hasTransactions,
    summary,
    topExpenseCategoryId,
  } = params;

  if (!hasTransactions) {
    return ["Add your first transaction to unlock insights."];
  }

  const insights: string[] = [];

  if (summary.monthlyExpenses > 0) {
    insights.push(`You spent ${formatMoney(summary.monthlyExpenses, currency)} this month.`);
  }

  if (summary.monthlyIncome > summary.monthlyExpenses) {
    insights.push(
      `You saved ${formatMoney(summary.monthlyIncome - summary.monthlyExpenses, currency)} this month.`,
    );
  } else if (summary.monthlyExpenses > summary.monthlyIncome) {
    insights.push("Your expenses are higher than your income this month.");
  }

  if (topExpenseCategoryId) {
    const topCategory = categories.find((category) => category.id === topExpenseCategoryId);
    if (topCategory) {
      insights.push(`Your highest spending category is ${topCategory.name}.`);
    }
  }

  const dangerBudget = budgetUsage.find(
    (usage) => getBudgetStatus(usage.percentageUsed) === "danger",
  );
  if (dangerBudget) {
    insights.push(`You are close to or over your ${dangerBudget.category.name} budget.`);
  }

  return insights;
}
