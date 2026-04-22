import { useMemo, useState } from "react";
import {
  calculateFinanceSummary,
  createSeedTransactions,
  sortTransactionsByDate,
} from "@/features/finance/finance.utils";
import { FinanceSummary, FinanceTransaction } from "@/features/finance/types";

export interface UseFinanceStateResult {
  addTransaction: (transaction: FinanceTransaction) => void;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export function useFinanceState(): UseFinanceStateResult {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() =>
    sortTransactionsByDate(createSeedTransactions()),
  );

  const summary = useMemo(() => calculateFinanceSummary(transactions), [transactions]);

  function addTransaction(transaction: FinanceTransaction): void {
    setTransactions((currentTransactions) =>
      sortTransactionsByDate([transaction, ...currentTransactions]),
    );
  }

  return {
    addTransaction,
    summary,
    transactions,
  };
}
