import {
  FinanceCategory,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";

export type FinanceAnalyticsRange = "weekly" | "monthly" | "yearly";

export interface FinanceTrendPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
  netCashflow: number;
}

export interface ExpenseBreakdownPoint {
  categoryId: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface MonthlyCashflowPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
}

export interface FinanceInsightItem {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
}

export interface FinanceAnalyticsDashboard {
  trend: FinanceTrendPoint[];
  expenseBreakdown: ExpenseBreakdownPoint[];
  monthlyCashflow: MonthlyCashflowPoint[];
  insights: FinanceInsightItem[];
  currentPeriodExpenses: number;
  previousPeriodExpenses: number;
  currentPeriodIncome: number;
}

interface CalculateFinanceAnalyticsInput {
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  now?: Date;
  range: FinanceAnalyticsRange;
  transactions: FinanceTransaction[];
}

interface DateRange {
  start: Date;
  end: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateFinanceAnalyticsDashboard({
  budgetUsage,
  categories,
  now = new Date(),
  range,
  transactions,
}: CalculateFinanceAnalyticsInput): FinanceAnalyticsDashboard {
  const currentRange = getCurrentDateRange(range, now);
  const previousRange = getPreviousDateRange(currentRange, range);
  const currentTransactions = filterTransactionsByRange(transactions, currentRange);
  const previousTransactions = filterTransactionsByRange(transactions, previousRange);
  const currentPeriodIncome = sumTransactions(currentTransactions, "income");
  const currentPeriodExpenses = sumTransactions(currentTransactions, "expense");
  const previousPeriodExpenses = sumTransactions(previousTransactions, "expense");
  const expenseBreakdown = calculateExpenseBreakdown(currentTransactions, categories);

  return {
    trend: calculateTrendPoints(transactions, range, now),
    expenseBreakdown,
    monthlyCashflow: calculateMonthlyCashflow(transactions, now),
    insights: calculateFinanceInsightItems({
      budgetUsage,
      currentPeriodExpenses,
      currentPeriodIncome,
      expenseBreakdown,
      previousPeriodExpenses,
      range,
    }),
    currentPeriodExpenses,
    previousPeriodExpenses,
    currentPeriodIncome,
  };
}

function calculateTrendPoints(
  transactions: FinanceTransaction[],
  range: FinanceAnalyticsRange,
  now: Date,
): FinanceTrendPoint[] {
  if (range === "weekly") {
    return Array.from({ length: 8 }, (_, index) => {
      const date = addDays(startOfWeek(now), (index - 7) * 7);
      const period = { start: date, end: endOfWeek(date) };
      return createTrendPoint(transactions, period, formatShortDate(date), toDateKey(date));
    });
  }

  if (range === "monthly") {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1, 12);
      const period = { start: startOfMonth(date), end: endOfMonth(date) };
      return createTrendPoint(transactions, period, formatMonthLabel(date), toMonthKey(date));
    });
  }

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now.getFullYear() - 4 + index, 0, 1, 12);
    const period = { start: startOfYear(date), end: endOfYear(date) };
    return createTrendPoint(transactions, period, String(date.getFullYear()), String(date.getFullYear()));
  });
}

function createTrendPoint(
  transactions: FinanceTransaction[],
  period: DateRange,
  label: string,
  key: string,
): FinanceTrendPoint {
  const periodTransactions = filterTransactionsByRange(transactions, period);
  const income = sumTransactions(periodTransactions, "income");
  const expenses = sumTransactions(periodTransactions, "expense");

  return {
    key,
    label,
    income,
    expenses,
    netCashflow: income - expenses,
  };
}

function calculateExpenseBreakdown(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
): ExpenseBreakdownPoint[] {
  const totals = new Map<string, number>();
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => {
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
      return total + transaction.amount;
    }, 0);

  return Array.from(totals.entries())
    .map(([categoryId, value]) => {
      const category = categories.find((item) => item.id === categoryId);
      return {
        categoryId,
        name: category?.name ?? "Uncategorized",
        value,
        percentage: expenseTotal > 0 ? (value / expenseTotal) * 100 : 0,
        color: category?.color ?? "#64748b",
      };
    })
    .sort((left, right) => right.value - left.value);
}

function calculateMonthlyCashflow(
  transactions: FinanceTransaction[],
  now: Date,
): MonthlyCashflowPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1, 12);
    const period = { start: startOfMonth(date), end: endOfMonth(date) };
    const periodTransactions = filterTransactionsByRange(transactions, period);

    return {
      key: toMonthKey(date),
      label: formatMonthLabel(date),
      income: sumTransactions(periodTransactions, "income"),
      expenses: sumTransactions(periodTransactions, "expense"),
    };
  });
}

function calculateFinanceInsightItems({
  budgetUsage,
  currentPeriodExpenses,
  currentPeriodIncome,
  expenseBreakdown,
  previousPeriodExpenses,
  range,
}: {
  budgetUsage: MonthlyBudgetUsage[];
  currentPeriodExpenses: number;
  currentPeriodIncome: number;
  expenseBreakdown: ExpenseBreakdownPoint[];
  previousPeriodExpenses: number;
  range: FinanceAnalyticsRange;
}): FinanceInsightItem[] {
  const largestCategory = expenseBreakdown[0];
  const spendingDelta = currentPeriodExpenses - previousPeriodExpenses;
  const spendingDeltaPercentage =
    previousPeriodExpenses > 0 ? (spendingDelta / previousPeriodExpenses) * 100 : 0;
  const averageDailySpending = currentPeriodExpenses / getPeriodDayCount(range);
  const savingsRate =
    currentPeriodIncome > 0
      ? ((currentPeriodIncome - currentPeriodExpenses) / currentPeriodIncome) * 100
      : 0;
  const overBudgetCategories = budgetUsage.filter((usage) => usage.percentageUsed >= 100);
  const nearBudgetCategories = budgetUsage.filter(
    (usage) => usage.percentageUsed >= 90 && usage.percentageUsed < 100,
  );

  const insights: FinanceInsightItem[] = [
    {
      id: "largest-category",
      title: "Largest spending category",
      value: largestCategory ? largestCategory.name : "No expense data",
      detail: largestCategory
        ? `${largestCategory.name} represents ${Math.round(largestCategory.percentage)}% of spending in this period.`
        : "Add expense transactions to see category concentration.",
      tone: largestCategory && largestCategory.percentage >= 40 ? "warning" : "neutral",
    },
    {
      id: "spending-change",
      title: "Spending trend",
      value:
        previousPeriodExpenses > 0
          ? `${spendingDelta >= 0 ? "+" : ""}${Math.round(spendingDeltaPercentage)}%`
          : "New baseline",
      detail:
        previousPeriodExpenses > 0
          ? `Expenses are ${spendingDelta >= 0 ? "higher" : "lower"} than the previous ${range} period.`
          : "There is not enough previous-period data for a comparison yet.",
      tone: spendingDelta > 0 ? "warning" : spendingDelta < 0 ? "positive" : "neutral",
    },
    {
      id: "average-daily-spending",
      title: "Average daily spending",
      value: averageDailySpending.toFixed(0),
      detail: "A simple daily pace based on expenses in the selected period.",
      tone: "neutral",
    },
    {
      id: "savings-rate",
      title: "Savings rate",
      value: `${Math.round(savingsRate)}%`,
      detail:
        currentPeriodIncome > 0
          ? "Net cashflow divided by income for this period."
          : "Add income transactions to calculate a savings rate.",
      tone: savingsRate >= 20 ? "positive" : savingsRate < 0 ? "warning" : "neutral",
    },
    {
      id: "budget-warnings",
      title: "Budget warnings",
      value:
        overBudgetCategories.length > 0
          ? `${overBudgetCategories.length} over budget`
          : nearBudgetCategories.length > 0
            ? `${nearBudgetCategories.length} near limit`
            : "On track",
      detail:
        overBudgetCategories.length > 0
          ? `${overBudgetCategories.map((usage) => usage.category.name).join(", ")} exceeded the monthly budget.`
          : nearBudgetCategories.length > 0
            ? `${nearBudgetCategories.map((usage) => usage.category.name).join(", ")} is close to the monthly budget.`
            : "No configured budget category is currently above 90% usage.",
      tone: overBudgetCategories.length > 0 || nearBudgetCategories.length > 0 ? "warning" : "positive",
    },
  ];

  return insights;
}

function filterTransactionsByRange(
  transactions: FinanceTransaction[],
  range: DateRange,
): FinanceTransaction[] {
  const startKey = toDateKey(range.start);
  const endKey = toDateKey(range.end);

  return transactions.filter(
    (transaction) => transaction.date >= startKey && transaction.date <= endKey,
  );
}

function sumTransactions(
  transactions: FinanceTransaction[],
  type: "income" | "expense",
): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getCurrentDateRange(range: FinanceAnalyticsRange, now: Date): DateRange {
  switch (range) {
    case "weekly":
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case "monthly":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "yearly":
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

function getPreviousDateRange(currentRange: DateRange, range: FinanceAnalyticsRange): DateRange {
  switch (range) {
    case "weekly": {
      const start = addDays(currentRange.start, -7);
      return { start, end: endOfWeek(start) };
    }
    case "monthly": {
      const start = new Date(currentRange.start.getFullYear(), currentRange.start.getMonth() - 1, 1, 12);
      return { start, end: endOfMonth(start) };
    }
    case "yearly": {
      const start = new Date(currentRange.start.getFullYear() - 1, 0, 1, 12);
      return { start, end: endOfYear(start) };
    }
  }
}

function getPeriodDayCount(range: FinanceAnalyticsRange): number {
  switch (range) {
    case "weekly":
      return 7;
    case "monthly":
      return 30;
    case "yearly":
      return 365;
  }
}

function startOfWeek(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = next.getDay() === 0 ? 7 : next.getDay();
  next.setDate(next.getDate() - day + 1);
  return next;
}

function endOfWeek(date: Date): Date {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 12);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 12);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}
