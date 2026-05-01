import {
  FinanceCategory,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";

export type FinanceAnalyticsPeriod = "weekly" | "monthly" | "yearly" | "all-time";
export type FinanceAnalyticsRange = FinanceAnalyticsPeriod;

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
  netCashflow: number;
}

export interface BudgetUsagePoint {
  categoryId: string;
  categoryName: string;
  color: string;
  spentAmount: number;
  budgetAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: "healthy" | "warning" | "over";
}

export interface BudgetWarning {
  categoryId: string;
  categoryName: string;
  amountOver: number;
  percentageUsed: number;
}

export interface FinanceInsightItem {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
}

export interface FinanceAnalyticsDashboard {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  averageDailySpending: number;
  topExpenseCategory?: ExpenseBreakdownPoint;
  transactionCount: number;
  categoryBreakdown: ExpenseBreakdownPoint[];
  incomeExpenseTrend: FinanceTrendPoint[];
  monthlyCashflow: MonthlyCashflowPoint[];
  budgetUsage: BudgetUsagePoint[];
  budgetWarnings: BudgetWarning[];
  smartInsights: FinanceInsightItem[];
  period: FinanceAnalyticsPeriod;
  periodLabel: string;
}

interface CalculateFinanceAnalyticsInput {
  categories: FinanceCategory[];
  now?: Date;
  period: FinanceAnalyticsPeriod;
  transactions: FinanceTransaction[];
}

interface LegacyCalculateFinanceAnalyticsInput extends Omit<CalculateFinanceAnalyticsInput, "period"> {
  range: FinanceAnalyticsPeriod;
}

interface DateRange {
  start?: Date;
  end?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#475569",
];

export function calculateFinanceAnalytics(
  input: CalculateFinanceAnalyticsInput,
): FinanceAnalyticsDashboard {
  const { categories, now = new Date(), period, transactions } = input;
  const range = getDateRange(period, now, transactions);
  const periodTransactions = filterTransactionsByRange(transactions, range);
  const totalIncome = sumTransactions(periodTransactions, "income");
  const totalExpenses = sumTransactions(periodTransactions, "expense");
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const categoryBreakdown = calculateExpenseBreakdown(periodTransactions, categories);
  const budgetUsage = calculateBudgetUsage(periodTransactions, categories, range, now);
  const budgetWarnings = budgetUsage
    .filter((usage) => usage.status === "over")
    .map((usage) => ({
      categoryId: usage.categoryId,
      categoryName: usage.categoryName,
      amountOver: Math.abs(usage.remainingAmount),
      percentageUsed: usage.percentageUsed,
    }));
  const averageDailySpending = totalExpenses / getRangeDayCount(range, now);

  const dashboard: FinanceAnalyticsDashboard = {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    averageDailySpending,
    topExpenseCategory: categoryBreakdown[0],
    transactionCount: periodTransactions.length,
    categoryBreakdown,
    incomeExpenseTrend: calculateTrendPoints(transactions, period, now),
    monthlyCashflow: calculateMonthlyCashflow(transactions, period, now),
    budgetUsage,
    budgetWarnings,
    smartInsights: [],
    period,
    periodLabel: getPeriodLabel(period),
  };

  return {
    ...dashboard,
    smartInsights: calculateSmartInsights(dashboard),
  };
}

export function calculateFinanceAnalyticsDashboard(
  input: CalculateFinanceAnalyticsInput | LegacyCalculateFinanceAnalyticsInput,
): FinanceAnalyticsDashboard {
  const period = "period" in input ? input.period : input.range;

  return calculateFinanceAnalytics({
    categories: input.categories,
    now: input.now,
    period,
    transactions: input.transactions,
  });
}

function calculateTrendPoints(
  transactions: FinanceTransaction[],
  period: FinanceAnalyticsPeriod,
  now: Date,
): FinanceTrendPoint[] {
  if (period === "weekly") {
    const weekStart = startOfWeek(now);

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return createTrendPoint(
        transactions,
        { start: startOfDay(date), end: endOfDay(date) },
        formatDayLabel(date),
        toDateKey(date),
      );
    });
  }

  if (period === "monthly") {
    return Array.from({ length: now.getDate() }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), index + 1, 12);
      return createTrendPoint(
        transactions,
        { start: startOfDay(date), end: endOfDay(date) },
        formatDayLabel(date),
        toDateKey(date),
      );
    });
  }

  const monthCount = period === "yearly" ? 12 : getAllTimeMonthCount(transactions, now);
  const firstMonth =
    period === "yearly"
      ? new Date(now.getFullYear(), 0, 1, 12)
      : getFirstTransactionMonth(transactions, now);

  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1, 12);
    return createTrendPoint(
      transactions,
      { start: startOfMonth(date), end: endOfMonth(date) },
      formatMonthYearLabel(date),
      toMonthKey(date),
    );
  });
}

function createTrendPoint(
  transactions: FinanceTransaction[],
  range: DateRange,
  label: string,
  key: string,
): FinanceTrendPoint {
  const periodTransactions = filterTransactionsByRange(transactions, range);
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
      const categoryId = transaction.categoryId || "uncategorized";
      totals.set(categoryId, (totals.get(categoryId) ?? 0) + transaction.amount);
      return total + transaction.amount;
    }, 0);

  return Array.from(totals.entries())
    .map(([categoryId, value], index) => {
      const category = categories.find((item) => item.id === categoryId);

      return {
        categoryId,
        name: category?.name ?? "Uncategorized",
        value,
        percentage: expenseTotal > 0 ? (value / expenseTotal) * 100 : 0,
        color: category?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      };
    })
    .sort((left, right) => right.value - left.value);
}

function calculateMonthlyCashflow(
  transactions: FinanceTransaction[],
  period: FinanceAnalyticsPeriod,
  now: Date,
): MonthlyCashflowPoint[] {
  const periodRange = getDateRange(period, now, transactions);
  const firstMonth =
    period === "all-time"
      ? getFirstTransactionMonth(transactions, now)
      : periodRange.start
        ? new Date(periodRange.start.getFullYear(), periodRange.start.getMonth(), 1, 12)
        : new Date(now.getFullYear(), now.getMonth(), 1, 12);
  const lastMonth =
    periodRange.end && periodRange.end < now
      ? new Date(periodRange.end.getFullYear(), periodRange.end.getMonth(), 1, 12)
      : new Date(now.getFullYear(), now.getMonth(), 1, 12);
  const monthCount =
    period === "all-time"
      ? getAllTimeMonthCount(transactions, now)
      : Math.max(
          1,
          (lastMonth.getFullYear() - firstMonth.getFullYear()) * 12 +
            lastMonth.getMonth() -
            firstMonth.getMonth() +
            1,
        );

  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1, 12);
    const periodTransactions = filterTransactionsByRange(transactions, {
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
    const income = sumTransactions(periodTransactions, "income");
    const expenses = sumTransactions(periodTransactions, "expense");

    return {
      key: toMonthKey(date),
      label: formatMonthYearLabel(date),
      income,
      expenses,
      netCashflow: income - expenses,
    };
  });
}

function calculateBudgetUsage(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  range: DateRange,
  now: Date,
): BudgetUsagePoint[] {
  const budgetMultiplier = getBudgetMonthMultiplier(range, now);

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
            transaction.type === "expense" && transaction.categoryId === category.id,
        )
        .reduce((total, transaction) => total + transaction.amount, 0);
      const budgetAmount = (category.monthlyBudget ?? 0) * budgetMultiplier;
      const percentageUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      return {
        categoryId: category.id,
        categoryName: category.name,
        color: category.color,
        spentAmount,
        budgetAmount,
        remainingAmount: budgetAmount - spentAmount,
        percentageUsed,
        status: getBudgetUsageStatus(percentageUsed),
      };
    })
    .sort((left, right) => right.percentageUsed - left.percentageUsed);
}

function calculateSmartInsights(dashboard: FinanceAnalyticsDashboard): FinanceInsightItem[] {
  if (dashboard.transactionCount === 0) {
    return [];
  }

  const insights: FinanceInsightItem[] = [];
  const topCategory = dashboard.topExpenseCategory;
  const topBudget = dashboard.budgetUsage[0];

  if (topCategory) {
    insights.push({
      id: "largest-expense-category",
      title: "Largest expense category",
      value: topCategory.name,
      detail: `${topCategory.name} accounts for ${formatPercent(topCategory.percentage)} of expenses this period.`,
      tone: topCategory.percentage >= 40 ? "warning" : "neutral",
    });
  }

  insights.push({
    id: "net-savings",
    title: dashboard.netSavings >= 0 ? "Saved this period" : "Cashflow gap",
    value: formatSignedAmount(dashboard.netSavings),
    detail:
      dashboard.netSavings >= 0
        ? "Income exceeded expenses in the selected period."
        : "Expenses exceeded income in the selected period.",
    tone: dashboard.netSavings >= 0 ? "positive" : "warning",
  });

  if (dashboard.totalIncome > 0) {
    insights.push({
      id: "savings-rate",
      title: "Savings rate",
      value: formatPercent(dashboard.savingsRate),
      detail: "Net savings divided by income for the selected period.",
      tone:
        dashboard.savingsRate >= 20
          ? "positive"
          : dashboard.savingsRate < 0
            ? "warning"
            : "neutral",
    });
  }

  insights.push({
    id: "average-daily-spending",
    title: "Average daily spending",
    value: formatSignedAmount(dashboard.averageDailySpending),
    detail: "Daily expense pace based on the selected period.",
    tone: "neutral",
  });

  if (topBudget) {
    insights.push({
      id: "top-budget-usage",
      title: "Highest budget usage",
      value: `${topBudget.categoryName} ${formatPercent(topBudget.percentageUsed)}`,
      detail:
        topBudget.remainingAmount >= 0
          ? `${topBudget.categoryName} still has ${formatSignedAmount(topBudget.remainingAmount)} remaining.`
          : `${topBudget.categoryName} is over budget by ${formatSignedAmount(Math.abs(topBudget.remainingAmount))}.`,
      tone: topBudget.status === "over" ? "warning" : topBudget.status === "warning" ? "warning" : "positive",
    });
  }

  insights.push({
    id: "budget-attention",
    title: "Budget attention",
    value:
      dashboard.budgetWarnings.length > 0
        ? `${dashboard.budgetWarnings.length} over budget`
        : "No budget needs attention",
    detail:
      dashboard.budgetWarnings.length > 0
        ? dashboard.budgetWarnings
            .map((warning) => `${warning.categoryName} by ${formatSignedAmount(warning.amountOver)}`)
            .join(", ")
        : "Configured budgets are below their limits for this period.",
    tone: dashboard.budgetWarnings.length > 0 ? "warning" : "positive",
  });

  return insights.slice(0, Math.max(3, Math.min(insights.length, 6)));
}

function filterTransactionsByRange(
  transactions: FinanceTransaction[],
  range: DateRange,
): FinanceTransaction[] {
  const startKey = range.start ? toDateKey(range.start) : undefined;
  const endKey = range.end ? toDateKey(range.end) : undefined;

  return transactions.filter((transaction) => {
    if (!isDateKey(transaction.date)) {
      return false;
    }

    return (
      (startKey === undefined || transaction.date >= startKey) &&
      (endKey === undefined || transaction.date <= endKey)
    );
  });
}

function sumTransactions(
  transactions: FinanceTransaction[],
  type: "income" | "expense",
): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getDateRange(
  period: FinanceAnalyticsPeriod,
  now: Date,
  transactions: FinanceTransaction[],
): DateRange {
  switch (period) {
    case "weekly":
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case "monthly":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "yearly":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "all-time":
      return {
        start: transactions.length > 0 ? getFirstTransactionDate(transactions) : undefined,
        end: endOfDay(now),
      };
  }
}

function getBudgetUsageStatus(percentage: number): BudgetUsagePoint["status"] {
  if (percentage >= 100) {
    return "over";
  }

  if (percentage >= 70) {
    return "warning";
  }

  return "healthy";
}

function getBudgetMonthMultiplier(range: DateRange, now: Date): number {
  if (!range.start || !range.end) {
    return 1;
  }

  const startMonth = new Date(range.start.getFullYear(), range.start.getMonth(), 1, 12);
  const endMonth = new Date(
    Math.min(range.end.getTime(), now.getTime()),
  );

  return Math.max(
    1,
    (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
      endMonth.getMonth() -
      startMonth.getMonth() +
      1,
  );
}

function getRangeDayCount(range: DateRange, now: Date): number {
  if (!range.start) {
    return 1;
  }

  const end = range.end && range.end < now ? range.end : now;
  const diff = endOfDay(end).getTime() - startOfDay(range.start).getTime();

  return Math.max(1, Math.floor(diff / DAY_MS) + 1);
}

function getAllTimeMonthCount(transactions: FinanceTransaction[], now: Date): number {
  const firstMonth = getFirstTransactionMonth(transactions, now);

  return Math.max(
    1,
    (now.getFullYear() - firstMonth.getFullYear()) * 12 +
      now.getMonth() -
      firstMonth.getMonth() +
      1,
  );
}

function getFirstTransactionDate(transactions: FinanceTransaction[]): Date | undefined {
  const firstDate = transactions
    .map((transaction) => parseFinanceDate(transaction.date))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => left.getTime() - right.getTime())[0];

  return firstDate ? startOfDay(firstDate) : undefined;
}

function getFirstTransactionMonth(transactions: FinanceTransaction[], now: Date): Date {
  const firstDate = getFirstTransactionDate(transactions);

  if (!firstDate) {
    return new Date(now.getFullYear(), now.getMonth(), 1, 12);
  }

  return new Date(firstDate.getFullYear(), firstDate.getMonth(), 1, 12);
}

function getPeriodLabel(period: FinanceAnalyticsPeriod): string {
  switch (period) {
    case "weekly":
      return "this week";
    case "monthly":
      return "this month";
    case "yearly":
      return "this year";
    case "all-time":
      return "all time";
  }
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseFinanceDate(value: string): Date | null {
  if (!isDateKey(value)) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const day = next.getDay() === 0 ? 7 : next.getDay();
  next.setDate(next.getDate() - day + 1);
  return next;
}

function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
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

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date);
}

function formatMonthYearLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatSignedAmount(value: number): string {
  return `€${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}
