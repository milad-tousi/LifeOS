import { useLiveQuery } from "dexie-react-hooks";
import { financeRepository } from "@/domains/finance/repository";
import { Expense } from "@/domains/finance/types";

export interface UseFinanceResult {
  expenses: Expense[];
  loading: boolean;
}

export function useFinance(): UseFinanceResult {
  const expenses = useLiveQuery(() => financeRepository.getAll(), []);

  return {
    expenses: expenses ?? [],
    loading: expenses === undefined,
  };
}
