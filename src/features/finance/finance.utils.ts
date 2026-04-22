import { createId } from "@/lib/id";
import { FinanceSummary, FinanceTransaction, TransactionType } from "@/features/finance/types";

export const EXPENSE_CATEGORIES = [
  "Grocery",
  "Transport",
  "Food",
  "Health",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Gift", "Other"] as const;

export function getCategoriesForType(type: TransactionType): readonly string[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function createSeedTransactions(): FinanceTransaction[] {
  return [
    {
      id: createId(),
      type: "income",
      amount: 4200,
      category: "Salary",
      merchant: "Primary Salary",
      date: "2026-04-01",
      note: "Monthly salary payout",
    },
    {
      id: createId(),
      type: "expense",
      amount: 84.5,
      category: "Grocery",
      merchant: "Fresh Market",
      date: "2026-04-19",
      note: "Weekly groceries",
    },
    {
      id: createId(),
      type: "expense",
      amount: 42,
      category: "Transport",
      merchant: "NS Travel",
      date: "2026-04-20",
      note: "Train pass top-up",
    },
    {
      id: createId(),
      type: "income",
      amount: 650,
      category: "Freelance",
      merchant: "Design Retainer",
      date: "2026-04-16",
      note: "Landing page refresh project",
    },
    {
      id: createId(),
      type: "expense",
      amount: 129.99,
      category: "Bills",
      merchant: "Utilities Bundle",
      date: "2026-04-12",
    },
  ];
}

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

export function sortTransactionsByDate(
  transactions: FinanceTransaction[],
): FinanceTransaction[] {
  return [...transactions].sort((left, right) => right.date.localeCompare(left.date));
}

function isSameMonth(dateValue: string, month: number, year: number): boolean {
  const safeDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return false;
  }

  return safeDate.getMonth() === month && safeDate.getFullYear() === year;
}
