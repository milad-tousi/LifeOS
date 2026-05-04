import { FinanceCategory, FinanceSummary } from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage, getBudgetStatus } from "@/features/finance/utils/finance.budgets";
import { formatMoney } from "@/features/finance/utils/finance.format";

export interface FinanceLegacyInsight {
  id:
    | "add-first-transaction"
    | "spent-this-month"
    | "saved-this-month"
    | "expenses-higher-than-income"
    | "highest-category"
    | "close-to-budget";
  values?: Record<string, string>;
}

export function getFinanceInsights(params: {
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: "EUR" | "USD" | "GBP" | "IRR";
  hasTransactions: boolean;
  summary: FinanceSummary;
  topExpenseCategoryId?: string;
}): FinanceLegacyInsight[] {
  const {
    budgetUsage,
    categories,
    currency,
    hasTransactions,
    summary,
    topExpenseCategoryId,
  } = params;

  if (!hasTransactions) {
    return [{ id: "add-first-transaction" }];
  }

  const insights: FinanceLegacyInsight[] = [];

  if (summary.monthlyExpenses > 0) {
    insights.push({
      id: "spent-this-month",
      values: { amount: formatMoney(summary.monthlyExpenses, currency) },
    });
  }

  if (summary.monthlyIncome > summary.monthlyExpenses) {
    insights.push({
      id: "saved-this-month",
      values: {
        amount: formatMoney(summary.monthlyIncome - summary.monthlyExpenses, currency),
      },
    });
  } else if (summary.monthlyExpenses > summary.monthlyIncome) {
    insights.push({ id: "expenses-higher-than-income" });
  }

  if (topExpenseCategoryId) {
    const topCategory = categories.find((category) => category.id === topExpenseCategoryId);
    if (topCategory) {
      insights.push({
        id: "highest-category",
        values: { category: topCategory.name },
      });
    }
  }

  const dangerBudget = budgetUsage.find(
    (usage) => getBudgetStatus(usage.percentageUsed) === "danger",
  );
  if (dangerBudget) {
    insights.push({
      id: "close-to-budget",
      values: { category: dangerBudget.category.name },
    });
  }

  return insights;
}
