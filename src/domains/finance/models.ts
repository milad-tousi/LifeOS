import { createId } from "@/lib/id";
import { Expense } from "@/domains/finance/types";

export function createExpenseModel(amount: number, category: string): Expense {
  return {
    id: createId(),
    amount,
    category,
    expenseDate: new Date().toISOString().slice(0, 10),
    createdAt: Date.now(),
  };
}
