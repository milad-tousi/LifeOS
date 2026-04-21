import { EntityId, ISODateString, TimestampMs } from "@/types/shared.types";

export interface Expense {
  id: EntityId;
  amount: number;
  category: string;
  note?: string;
  expenseDate: ISODateString;
  createdAt: TimestampMs;
}
