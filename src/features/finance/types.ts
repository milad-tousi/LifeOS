export type TransactionType = "income" | "expense";

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  note?: string;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}
