import { FinanceCategory, TransactionType } from "@/features/finance/types/finance.types";
import { TranslationKey } from "@/i18n/i18n.types";

type Translate = (key: TranslationKey) => string;

const DEFAULT_CATEGORY_KEYS: Record<string, TranslationKey> = {
  bills: "finance.category.bills",
  entertainment: "finance.category.entertainment",
  food: "finance.category.food",
  freelance: "finance.category.freelance",
  gift: "finance.category.gift",
  grocery: "finance.category.grocery",
  health: "finance.category.health",
  investment: "finance.category.investment",
  other: "finance.category.other",
  salary: "finance.category.salary",
  shopping: "finance.category.shopping",
  transport: "finance.category.transport",
  travel: "finance.category.travel",
};

export function getFinanceCategoryDisplayName(
  category: FinanceCategory | undefined,
  t: Translate,
): string {
  if (!category) {
    return t("finance.unknownCategory");
  }

  const key = DEFAULT_CATEGORY_KEYS[category.name.trim().toLowerCase()];
  return key ? t(key) : category.name;
}

export function getFinanceTypeDisplayName(type: TransactionType | "both" | "all", t: Translate): string {
  switch (type) {
    case "income":
      return t("finance.income");
    case "expense":
      return t("finance.expense");
    case "both":
      return t("finance.both");
    case "all":
    default:
      return t("finance.all");
  }
}
