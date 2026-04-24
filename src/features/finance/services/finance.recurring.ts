import { RecurringTransaction, FinanceTransaction } from "@/features/finance/types/finance.types";
import { createId } from "@/lib/id";

const MAX_OCCURRENCES_PER_RUN = 500;

export function getNextOccurrenceDate(
  rule: RecurringTransaction,
  afterDate: string,
): string {
  const currentDate = parseDate(afterDate);

  switch (rule.repeat) {
    case "daily":
      currentDate.setDate(currentDate.getDate() + 1);
      break;
    case "weekly":
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case "monthly":
      return addMonths(afterDate, 1);
    case "yearly":
      return addYears(afterDate, 1);
    default:
      break;
  }

  return toDateString(currentDate);
}

export function getDueOccurrences(
  rule: RecurringTransaction,
  today: string,
): string[] {
  if (!rule.isActive) {
    return [];
  }

  if (rule.startDate > today) {
    return [];
  }

  const endDate = rule.endDate && rule.endDate < today ? rule.endDate : today;
  if (rule.endDate && rule.endDate < rule.startDate) {
    return [];
  }

  let nextDate = rule.startDate;
  const occurrences: string[] = [];
  let safetyCount = 0;

  while (nextDate <= endDate && safetyCount < MAX_OCCURRENCES_PER_RUN) {
    if (!rule.lastGeneratedAt || nextDate > rule.lastGeneratedAt) {
      occurrences.push(nextDate);
    }

    nextDate = getNextOccurrenceDate(rule, nextDate);
    safetyCount += 1;
  }

  return occurrences;
}

export function generateTransactionsFromRecurring(
  rules: RecurringTransaction[],
  existingTransactions: FinanceTransaction[],
  today = new Date().toISOString().slice(0, 10),
): {
  generatedTransactions: FinanceTransaction[];
  recurringTransactions: RecurringTransaction[];
} {
  const existingRecurringKeys = new Set(
    existingTransactions
      .filter((transaction) => transaction.recurringId)
      .map((transaction) => `${transaction.recurringId}:${transaction.date}`),
  );

  const generatedTransactions: FinanceTransaction[] = [];
  const recurringTransactions = rules.map((rule) => {
    const dueOccurrences = getDueOccurrences(rule, today);

    if (dueOccurrences.length === 0) {
      return rule;
    }

    for (const occurrenceDate of dueOccurrences) {
      const recurringKey = `${rule.id}:${occurrenceDate}`;

      if (existingRecurringKeys.has(recurringKey)) {
        continue;
      }

      generatedTransactions.push({
        id: createId(),
        recurringId: rule.id,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        merchant: rule.merchant,
        note: rule.note,
        date: occurrenceDate,
        createdAt: `${occurrenceDate}T12:00:00.000Z`,
      });
      existingRecurringKeys.add(recurringKey);
    }

    return {
      ...rule,
      lastGeneratedAt: dueOccurrences[dueOccurrences.length - 1],
    };
  });

  return {
    generatedTransactions,
    recurringTransactions,
  };
}

function parseDate(dateValue: string): Date {
  return new Date(`${dateValue}T12:00:00`);
}

function toDateString(dateValue: Date): string {
  return dateValue.toISOString().slice(0, 10);
}

function addMonths(dateValue: string, amount: number): string {
  const currentDate = parseDate(dateValue);
  const day = currentDate.getDate();

  currentDate.setDate(1);
  currentDate.setMonth(currentDate.getMonth() + amount);
  const maxDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  currentDate.setDate(Math.min(day, maxDay));

  return toDateString(currentDate);
}

function addYears(dateValue: string, amount: number): string {
  const currentDate = parseDate(dateValue);
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  currentDate.setFullYear(currentDate.getFullYear() + amount, month, 1);
  const maxDay = new Date(currentDate.getFullYear(), month + 1, 0).getDate();
  currentDate.setDate(Math.min(day, maxDay));

  return toDateString(currentDate);
}
