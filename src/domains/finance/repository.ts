import { db } from "@/db/dexie";
import { Expense } from "@/domains/finance/types";

export const financeRepository = {
  async getAll(): Promise<Expense[]> {
    return db.expenses.orderBy("date").reverse().toArray();
  },
};
