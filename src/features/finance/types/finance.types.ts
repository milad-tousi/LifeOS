export type TransactionType = "income" | "expense";
export type CategoryType = TransactionType | "both";
export type FinanceCurrency = "EUR" | "USD" | "GBP" | "IRR";

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  merchant: string;
  note?: string;
  date: string;
  recurringId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  monthlyBudget?: number;
}

export interface MerchantRule {
  id: string;
  name: string;
  categoryId: string;
  defaultType: TransactionType;
}

export type FinanceMerchantRule = MerchantRule;

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  merchant: string;
  note?: string;
  repeat: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastGeneratedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FinanceSettings {
  currency: FinanceCurrency;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface FinanceAnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  topExpenseCategoryId?: string;
  topExpenseCategoryTotal: number;
  transactionCount: number;
  budgetedCategories: number;
  overBudgetCategories: number;
  recurringMonthlyIncome: number;
  recurringMonthlyExpenses: number;
  recurringMonthlyNet: number;
}
