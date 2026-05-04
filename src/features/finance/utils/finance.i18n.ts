import { FinanceCategory, RecurringTransaction, TransactionType, VoiceAlias } from "@/features/finance/types/finance.types";
import { TranslationKey } from "@/i18n/i18n.types";

type Translate = (key: TranslationKey) => string;

const DEFAULT_CATEGORY_KEYS: Record<string, TranslationKey> = {
  bills: "finance.categories.bills",
  entertainment: "finance.categories.entertainment",
  food: "finance.categories.food",
  freelance: "finance.categories.freelance",
  gift: "finance.categories.gift",
  grocery: "finance.categories.grocery",
  health: "finance.categories.health",
  investment: "finance.categories.investment",
  other: "finance.categories.other",
  salary: "finance.categories.salary",
  shopping: "finance.categories.shopping",
  transport: "finance.categories.transport",
  travel: "finance.categories.travel",
};

export function getFinanceCategoryDisplayName(
  category: FinanceCategory | undefined,
  t: Translate,
): string {
  if (!category) {
    return t("finance.unknownCategory");
  }

  const key =
    DEFAULT_CATEGORY_KEYS[category.id.trim().toLowerCase()] ??
    DEFAULT_CATEGORY_KEYS[category.icon.trim().toLowerCase()] ??
    DEFAULT_CATEGORY_KEYS[category.name.trim().toLowerCase()];
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

export function getRecurringRepeatDisplayName(
  repeat: RecurringTransaction["repeat"],
  t: Translate,
): string {
  switch (repeat) {
    case "daily":
      return t("finance.recurring.repeatDaily");
    case "weekly":
      return t("finance.recurring.repeatWeekly");
    case "monthly":
      return t("finance.recurring.repeatMonthly");
    case "yearly":
    default:
      return t("finance.recurring.repeatYearly");
  }
}

export function getVoiceAliasTargetDisplayName(
  target: VoiceAlias["targetType"],
  t: Translate,
): string {
  switch (target) {
    case "merchant":
      return t("finance.voiceAliases.targetMerchant");
    case "category":
      return t("finance.voiceAliases.targetCategory");
    case "general":
    default:
      return t("finance.voiceAliases.targetGeneral");
  }
}
