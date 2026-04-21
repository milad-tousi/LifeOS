import { createId } from "@/lib/id";
import { Expense } from "@/domains/finance/types";

export function createExpenseModel(amount: number, category: string): Expense {
  return {
    id: createId(),
    amount,
    category,
    date: Date.now(),
  };
}
