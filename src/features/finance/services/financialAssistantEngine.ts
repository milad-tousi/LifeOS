import {
  FinancialAssistantBudgetSuggestion,
  FinancialAssistantEngineInput,
  FinancialAssistantInsight,
  FinancialAssistantQuickAction,
  FinancialAssistantSummary,
} from "@/features/finance/types/financialAssistant";

const FLEXIBLE_CATEGORY_KEYWORDS = [
  "grocery",
  "groceries",
  "food",
  "restaurant",
  "dining",
  "cafe",
  "shopping",
  "entertainment",
  "travel",
  "transport",
  "lifestyle",
  "خوراک",
  "غذا",
  "رستوران",
  "خرید",
  "سرگرمی",
  "سفر",
  "رفت‌وآمد",
];

const MAX_INSIGHTS = 5;
const MAX_BUDGET_SUGGESTIONS = 4;

interface ScoredInsight extends FinancialAssistantInsight {
  rank: number;
}

export function generateFinancialAssistantSummary(
  input: FinancialAssistantEngineInput,
): FinancialAssistantSummary {
  const t = input.translate;

  if (input.transactions.length === 0) {
    return {
      score: 0,
      scoreReasons: [],
      insights: [],
      budgetSuggestions: [],
      quickActions: [],
    };
  }

  const expenseControlScore = calculateExpenseControlScore(input);
  const budgetUsageScore = calculateBudgetUsageScore(input);
  const incomeBalanceScore = calculateIncomeBalanceScore(input);
  const recurringRiskScore = calculateRecurringRiskScore(input);
  const unusualSpendingScore = calculateUnusualSpendingScore(input);
  const savingsPotentialScore = calculateSavingsPotentialScore(input);

  const score = clampScore(
    Math.round(
      expenseControlScore * 0.22 +
        budgetUsageScore * 0.2 +
        incomeBalanceScore * 0.22 +
        recurringRiskScore * 0.12 +
        unusualSpendingScore * 0.12 +
        savingsPotentialScore * 0.12,
    ),
  );

  const scoreReasons = [
    buildExpenseControlReason(input, expenseControlScore),
    buildBudgetUsageReason(input, budgetUsageScore),
    buildIncomeBalanceReason(input, incomeBalanceScore),
    buildRecurringRiskReason(input, recurringRiskScore),
    buildUnusualSpendingReason(input, unusualSpendingScore),
    buildSavingsPotentialReason(input, savingsPotentialScore),
  ].filter(Boolean);

  const insights = collectInsights(input).slice(0, MAX_INSIGHTS);
  const budgetSuggestions = buildBudgetSuggestions(input).slice(0, MAX_BUDGET_SUGGESTIONS);
  const quickActions = buildQuickActions(insights);

  return {
    score,
    scoreReasons,
    insights,
    budgetSuggestions,
    quickActions,
  };
}

function calculateExpenseControlScore(input: FinancialAssistantEngineInput): number {
  const { totalExpenses, totalIncome } = input.analytics;

  if (totalExpenses <= 0) {
    return 50;
  }

  if (totalIncome <= 0) {
    return input.analytics.budgetWarnings.length > 0 ? 45 : 65;
  }

  const ratio = totalExpenses / totalIncome;

  if (ratio <= 0.55) {
    return 92;
  }

  if (ratio <= 0.7) {
    return 82;
  }

  if (ratio <= 0.85) {
    return 68;
  }

  if (ratio <= 1) {
    return 52;
  }

  return 26;
}

function calculateBudgetUsageScore(input: FinancialAssistantEngineInput): number {
  if (input.budgetUsage.length === 0) {
    return 55;
  }

  const averageUsage =
    input.budgetUsage.reduce((total, usage) => total + usage.percentageUsed, 0) /
    input.budgetUsage.length;
  const overBudgetCount = input.budgetUsage.filter((usage) => usage.percentageUsed >= 100).length;
  const nearBudgetCount = input.budgetUsage.filter(
    (usage) => usage.percentageUsed >= 80 && usage.percentageUsed < 100,
  ).length;

  return clampScore(
    Math.round(100 - averageUsage * 0.35 - overBudgetCount * 18 - nearBudgetCount * 8),
  );
}

function calculateIncomeBalanceScore(input: FinancialAssistantEngineInput): number {
  const { netSavings, totalIncome } = input.analytics;

  if (totalIncome <= 0) {
    return netSavings >= 0 ? 55 : 35;
  }

  const savingsRate = (netSavings / totalIncome) * 100;

  if (savingsRate >= 25) {
    return 94;
  }

  if (savingsRate >= 15) {
    return 82;
  }

  if (savingsRate >= 5) {
    return 68;
  }

  if (savingsRate >= 0) {
    return 55;
  }

  if (savingsRate >= -10) {
    return 34;
  }

  return 18;
}

function calculateRecurringRiskScore(input: FinancialAssistantEngineInput): number {
  const recurringExpenseShare = getRecurringExpenseShare(input);

  if (recurringExpenseShare <= 0.15) {
    return 86;
  }

  if (recurringExpenseShare <= 0.3) {
    return 72;
  }

  if (recurringExpenseShare <= 0.45) {
    return 56;
  }

  return 34;
}

function calculateUnusualSpendingScore(input: FinancialAssistantEngineInput): number {
  const unusualTransactions = getUnusualExpenseTransactions(input);

  if (unusualTransactions.length === 0) {
    return 82;
  }

  if (unusualTransactions.length === 1) {
    return 64;
  }

  if (unusualTransactions.length === 2) {
    return 48;
  }

  return 30;
}

function calculateSavingsPotentialScore(input: FinancialAssistantEngineInput): number {
  const flexibleSpend = getFlexibleCategorySpend(input);
  const { totalExpenses } = input.analytics;

  if (totalExpenses <= 0) {
    return 55;
  }

  const ratio = flexibleSpend / totalExpenses;

  if (ratio <= 0.18) {
    return 85;
  }

  if (ratio <= 0.28) {
    return 72;
  }

  if (ratio <= 0.38) {
    return 58;
  }

  return 42;
}

function buildExpenseControlReason(
  input: FinancialAssistantEngineInput,
  score: number,
): string {
  const t = input.translate;
  if (input.analytics.totalIncome <= 0) {
    return t("finance.assistant.reason.expenseControlNoIncome");
  }

  if (score >= 75) {
    return t("finance.assistant.reason.expenseControlStrong");
  }

  if (score >= 50) {
    return t("finance.assistant.reason.expenseControlModerate");
  }

  return t("finance.assistant.reason.expenseControlWeak");
}

function buildBudgetUsageReason(input: FinancialAssistantEngineInput, score: number): string {
  const t = input.translate;
  if (input.budgetUsage.length === 0) {
    return t("finance.assistant.reason.budgetUsageNoBudgets");
  }

  if (score >= 75) {
    return t("finance.assistant.reason.budgetUsageStrong");
  }

  if (score >= 50) {
    return t("finance.assistant.reason.budgetUsageModerate");
  }

  return t("finance.assistant.reason.budgetUsageWeak");
}

function buildIncomeBalanceReason(input: FinancialAssistantEngineInput, score: number): string {
  const t = input.translate;
  if (score >= 75) {
    return t("finance.assistant.reason.incomeBalanceStrong");
  }

  if (score >= 50) {
    return t("finance.assistant.reason.incomeBalanceModerate");
  }

  return t("finance.assistant.reason.incomeBalanceWeak");
}

function buildRecurringRiskReason(input: FinancialAssistantEngineInput, score: number): string {
  const t = input.translate;
  if (input.recurringTransactions.length === 0) {
    return t("finance.assistant.reason.recurringRiskNone");
  }

  if (score >= 70) {
    return t("finance.assistant.reason.recurringRiskStrong");
  }

  if (score >= 50) {
    return t("finance.assistant.reason.recurringRiskModerate");
  }

  return t("finance.assistant.reason.recurringRiskWeak");
}

function buildUnusualSpendingReason(input: FinancialAssistantEngineInput, score: number): string {
  const t = input.translate;
  const unusualCount = getUnusualExpenseTransactions(input).length;

  if (score >= 75) {
    return t("finance.assistant.reason.unusualStrong");
  }

  return t("finance.assistant.reason.unusualWeak", {
    count: unusualCount,
  });
}

function buildSavingsPotentialReason(
  input: FinancialAssistantEngineInput,
  score: number,
): string {
  const t = input.translate;
  if (score >= 75) {
    return t("finance.assistant.reason.savingsPotentialStrong");
  }

  if (score >= 55) {
    return t("finance.assistant.reason.savingsPotentialModerate");
  }

  return t("finance.assistant.reason.savingsPotentialWeak");
}

function collectInsights(input: FinancialAssistantEngineInput): FinancialAssistantInsight[] {
  const t = input.translate;
  const previousMonthTotals = getPreviousMonthTotals(input.transactions);
  const currentMonthExpense = input.summary.monthlyExpenses;
  const insights: ScoredInsight[] = [];

  if (input.analytics.netSavings < 0) {
    insights.push({
      id: "negative-net",
      title: t("finance.assistant.insight.negativeNet.title"),
      description: t("finance.assistant.insight.negativeNet.description"),
      severity: "high",
      suggestedAction: t("finance.assistant.insight.negativeNet.action"),
      actionType: "task",
      rank: 100,
    });
  }

  input.analytics.budgetWarnings.forEach((warning, index) => {
    insights.push({
      id: `budget-warning-${warning.categoryId}-${index}`,
      title: t("finance.assistant.insight.budgetWarning.title", {
        category: warning.categoryName,
      }),
      description: t("finance.assistant.insight.budgetWarning.description", {
        category: warning.categoryName,
        percent: Math.round(warning.percentageUsed),
      }),
      severity: "high",
      suggestedAction: t("finance.assistant.insight.budgetWarning.action", {
        category: warning.categoryName,
      }),
      actionType: "budget",
      rank: 95 - index,
    });
  });

  const nearBudgetUsage = input.budgetUsage
    .filter((usage) => usage.percentageUsed >= 80 && usage.percentageUsed < 100)
    .sort((left, right) => right.percentageUsed - left.percentageUsed)[0];

  if (nearBudgetUsage) {
    insights.push({
      id: `near-budget-${nearBudgetUsage.category.id}`,
      title: t("finance.assistant.insight.nearBudget.title", {
        category: nearBudgetUsage.category.name,
      }),
      description: t("finance.assistant.insight.nearBudget.description", {
        category: nearBudgetUsage.category.name,
        percent: Math.round(nearBudgetUsage.percentageUsed),
      }),
      severity: "medium",
      suggestedAction: t("finance.assistant.insight.nearBudget.action", {
        category: nearBudgetUsage.category.name,
      }),
      actionType: "task",
      rank: 83,
    });
  }

  const topExpenseCategory = input.analytics.topExpenseCategory;
  if (topExpenseCategory) {
    const matchingBudget = input.budgetUsage.find(
      (usage) => usage.category.id === topExpenseCategory.categoryId,
    );

    if (!matchingBudget) {
      insights.push({
        id: `missing-budget-${topExpenseCategory.categoryId}`,
        title: t("finance.assistant.insight.missingBudget.title", {
          category: topExpenseCategory.name,
        }),
        description: t("finance.assistant.insight.missingBudget.description", {
          category: topExpenseCategory.name,
        }),
        severity: "medium",
        suggestedAction: t("finance.assistant.insight.missingBudget.action", {
          category: topExpenseCategory.name,
        }),
        actionType: "budget",
        rank: 82,
      });
    }
  }

  if (previousMonthTotals.expenses > 0 && currentMonthExpense > previousMonthTotals.expenses * 1.15) {
    const increasePercent = Math.round(
      ((currentMonthExpense - previousMonthTotals.expenses) / previousMonthTotals.expenses) * 100,
    );
    insights.push({
      id: "month-over-month-spike",
      title: t("finance.assistant.insight.monthSpike.title"),
      description: t("finance.assistant.insight.monthSpike.description", {
        percent: increasePercent,
      }),
      severity: increasePercent >= 25 ? "high" : "medium",
      suggestedAction: t("finance.assistant.insight.monthSpike.action"),
      actionType: "task",
      rank: increasePercent >= 25 ? 90 : 76,
    });
  }

  const recurringExpenseShare = getRecurringExpenseShare(input);
  if (recurringExpenseShare >= 0.3) {
    insights.push({
      id: "recurring-expense-load",
      title: t("finance.assistant.insight.recurringLoad.title"),
      description: t("finance.assistant.insight.recurringLoad.description", {
        percent: Math.round(recurringExpenseShare * 100),
      }),
      severity: recurringExpenseShare >= 0.45 ? "high" : "medium",
      suggestedAction: t("finance.assistant.insight.recurringLoad.action"),
      actionType: "review",
      rank: recurringExpenseShare >= 0.45 ? 88 : 72,
    });
  }

  const weekendInsight = getWeekendSpendingInsight(input);
  if (weekendInsight) {
    insights.push(weekendInsight);
  }

  const unusualTransactions = getUnusualExpenseTransactions(input);
  if (unusualTransactions.length > 0) {
    const highest = unusualTransactions[0];
    insights.push({
      id: `unusual-${highest.id}`,
      title: t("finance.assistant.insight.unusual.title"),
      description: t("finance.assistant.insight.unusual.description", {
        merchant:
          highest.merchant || t("finance.assistant.insight.unusual.genericMerchant"),
      }),
      severity: "medium",
      suggestedAction: t("finance.assistant.insight.unusual.action"),
      actionType: "task",
      rank: 71,
    });
  }

  return insights
    .sort((left, right) => right.rank - left.rank)
    .map(({ rank, ...insight }) => insight);
}

function buildBudgetSuggestions(
  input: FinancialAssistantEngineInput,
): FinancialAssistantBudgetSuggestion[] {
  const t = input.translate;
  const categorySpending = getAverageMonthlyCategorySpend(input.transactions);

  return input.categories
    .filter((category) => category.type !== "income")
    .map((category) => {
      const averageSpend = categorySpending.get(category.id) ?? 0;
      const currentSpend =
        input.budgetUsage.find((usage) => usage.category.id === category.id)?.spentAmount ?? 0;

      if (averageSpend <= 0 && currentSpend <= 0) {
        return null;
      }

      const referenceSpend = Math.max(averageSpend, currentSpend);
      const isFlexible = isFlexibleCategory(category.name);
      const multiplier = isFlexible ? 0.9 : 1.05;
      const suggestedBudget = roundBudget(Math.max(25, referenceSpend * multiplier));
      const currentBudget = category.monthlyBudget ?? 0;
      const reason = currentBudget > 0
        ? t("finance.assistant.budgetSuggestion.adjustReason", {
            category: category.name,
          })
        : t("finance.assistant.budgetSuggestion.addReason", {
            category: category.name,
          });

      return {
        categoryId: category.id,
        categoryName: category.name,
        currentSpend,
        suggestedBudget:
          currentBudget > 0
            ? roundBudget((currentBudget + suggestedBudget) / 2)
            : suggestedBudget,
        reason,
      };
    })
    .filter((suggestion): suggestion is FinancialAssistantBudgetSuggestion => Boolean(suggestion))
    .sort((left, right) => right.currentSpend - left.currentSpend);
}

function buildQuickActions(
  insights: FinancialAssistantInsight[],
): FinancialAssistantQuickAction[] {
  return insights.slice(0, 3).map((insight) => ({
    id: insight.id,
    label: insight.suggestedAction,
    actionType: insight.actionType,
    description: insight.title,
  }));
}

function getPreviousMonthTotals(transactions: FinancialAssistantEngineInput["transactions"]) {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = previousMonth.getMonth();
  const year = previousMonth.getFullYear();

  return transactions.reduce(
    (totals, transaction) => {
      const safeDate = new Date(`${transaction.date}T12:00:00`);

      if (Number.isNaN(safeDate.getTime())) {
        return totals;
      }

      if (safeDate.getMonth() !== month || safeDate.getFullYear() !== year) {
        return totals;
      }

      if (transaction.type === "income") {
        totals.income += transaction.amount;
      } else {
        totals.expenses += transaction.amount;
      }

      return totals;
    },
    { expenses: 0, income: 0 },
  );
}

function getRecurringExpenseShare(input: FinancialAssistantEngineInput): number {
  const recurringExpenseMonthly = input.analytics.totalExpenses > 0
    ? input.recurringTransactions
        .filter((transaction) => transaction.isActive && transaction.type === "expense")
        .reduce((total, transaction) => total + getRecurringMonthlyAmount(transaction), 0)
    : 0;

  return input.analytics.totalExpenses > 0
    ? recurringExpenseMonthly / input.analytics.totalExpenses
    : 0;
}

function getRecurringMonthlyAmount(transaction: FinancialAssistantEngineInput["recurringTransactions"][number]): number {
  switch (transaction.repeat) {
    case "daily":
      return transaction.amount * 30;
    case "weekly":
      return transaction.amount * 4;
    case "monthly":
      return transaction.amount;
    case "yearly":
      return transaction.amount / 12;
    default:
      return transaction.amount;
  }
}

function getUnusualExpenseTransactions(
  input: FinancialAssistantEngineInput,
): FinancialAssistantEngineInput["transactions"] {
  const expenseTransactions = input.transactions
    .filter((transaction) => transaction.type === "expense")
    .sort((left, right) => right.amount - left.amount);

  if (expenseTransactions.length < 3) {
    return [];
  }

  const averageExpense =
    expenseTransactions.reduce((total, transaction) => total + transaction.amount, 0) /
    expenseTransactions.length;
  const threshold = averageExpense * 2.5;

  return expenseTransactions.filter((transaction) => transaction.amount >= threshold).slice(0, 3);
}

function getFlexibleCategorySpend(input: FinancialAssistantEngineInput): number {
  const flexibleCategoryIds = new Set(
    input.categories
      .filter((category) => isFlexibleCategory(category.name))
      .map((category) => category.id),
  );

  return input.transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && flexibleCategoryIds.has(transaction.categoryId),
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getWeekendSpendingInsight(
  input: FinancialAssistantEngineInput,
): ScoredInsight | null {
  const t = input.translate;
  const spending = input.transactions.reduce(
    (totals, transaction) => {
      if (transaction.type !== "expense") {
        return totals;
      }

      const safeDate = new Date(`${transaction.date}T12:00:00`);

      if (Number.isNaN(safeDate.getTime())) {
        return totals;
      }

      const isWeekend = safeDate.getDay() === 0 || safeDate.getDay() === 6;
      if (isWeekend) {
        totals.weekend.amount += transaction.amount;
        totals.weekend.count += 1;
      } else {
        totals.weekday.amount += transaction.amount;
        totals.weekday.count += 1;
      }

      return totals;
    },
    {
      weekday: { amount: 0, count: 0 },
      weekend: { amount: 0, count: 0 },
    },
  );

  if (spending.weekend.count < 2 || spending.weekday.count < 2) {
    return null;
  }

  const weekendAverage = spending.weekend.amount / spending.weekend.count;
  const weekdayAverage = spending.weekday.amount / spending.weekday.count;

  if (weekendAverage <= weekdayAverage * 1.2) {
    return null;
  }

  return {
    id: "weekend-spending",
    title: t("finance.assistant.insight.weekend.title"),
    description: t("finance.assistant.insight.weekend.description"),
    severity: weekendAverage >= weekdayAverage * 1.5 ? "medium" : "low",
    suggestedAction: t("finance.assistant.insight.weekend.action"),
    actionType: "task",
    rank: 68,
  };
}

function getAverageMonthlyCategorySpend(
  transactions: FinancialAssistantEngineInput["transactions"],
): Map<string, number> {
  const monthlyBuckets = new Map<string, Map<string, number>>();

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") {
      return;
    }

    const safeDate = new Date(`${transaction.date}T12:00:00`);
    if (Number.isNaN(safeDate.getTime())) {
      return;
    }

    const monthKey = `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
    const monthTotals = monthlyBuckets.get(monthKey) ?? new Map<string, number>();
    monthTotals.set(
      transaction.categoryId,
      (monthTotals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
    monthlyBuckets.set(monthKey, monthTotals);
  });

  const monthlyEntries = Array.from(monthlyBuckets.values()).slice(-3);
  const aggregate = new Map<string, number>();

  monthlyEntries.forEach((monthTotals) => {
    monthTotals.forEach((amount, categoryId) => {
      aggregate.set(categoryId, (aggregate.get(categoryId) ?? 0) + amount);
    });
  });

  const divisor = Math.max(1, monthlyEntries.length);
  aggregate.forEach((amount, categoryId) => {
    aggregate.set(categoryId, amount / divisor);
  });

  return aggregate;
}

function isFlexibleCategory(name: string): boolean {
  const normalizedName = name.trim().toLowerCase();
  return FLEXIBLE_CATEGORY_KEYWORDS.some((keyword) => normalizedName.includes(keyword));
}

function roundBudget(value: number): number {
  if (value >= 1000) {
    return Math.round(value / 50) * 50;
  }

  if (value >= 200) {
    return Math.round(value / 10) * 10;
  }

  return Math.round(value / 5) * 5;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
