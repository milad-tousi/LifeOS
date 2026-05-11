import { STORAGE_KEYS } from "@/constants/storage.keys";
import {
  FinanceCategory,
  FinanceSettings,
  SmartRule,
  FinanceTransaction,
  MerchantRule,
  RecurringTransaction,
  TransactionType,
  VoiceAlias,
} from "@/features/finance/types/finance.types";

const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  currency: "EUR",
};

const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: "grocery", name: "Grocery", type: "expense", icon: "grocery", color: "#22c55e", monthlyBudget: 350 },
  { id: "transport", name: "Transport", type: "expense", icon: "transport", color: "#2563eb", monthlyBudget: 140 },
  { id: "bills", name: "Bills", type: "expense", icon: "bills", color: "#f97316", monthlyBudget: 220 },
  { id: "health", name: "Health", type: "expense", icon: "health", color: "#ef4444", monthlyBudget: 90 },
  { id: "entertainment", name: "Entertainment", type: "expense", icon: "entertainment", color: "#8b5cf6", monthlyBudget: 120 },
  { id: "travel", name: "Travel", type: "expense", icon: "travel", color: "#0f766e", monthlyBudget: 180 },
  { id: "shopping", name: "Shopping", type: "expense", icon: "shopping", color: "#ec4899", monthlyBudget: 160 },
  { id: "food", name: "Food", type: "expense", icon: "food", color: "#f59e0b", monthlyBudget: 200 },
  { id: "salary", name: "Salary", type: "income", icon: "salary", color: "#15803d" },
  { id: "freelance", name: "Freelance", type: "income", icon: "freelance", color: "#0891b2" },
  { id: "investment", name: "Investment", type: "income", icon: "investment", color: "#7c3aed" },
  { id: "gift", name: "Gift", type: "income", icon: "gift", color: "#d946ef" },
  { id: "other", name: "Other", type: "income", icon: "other", color: "#64748b" },
];

const DEFAULT_MERCHANT_RULES: MerchantRule[] = [
  { id: "rule-vomar", name: "Vomar", categoryId: "grocery", defaultType: "expense" },
  { id: "rule-albert-heijn", name: "Albert Heijn", categoryId: "grocery", defaultType: "expense" },
  { id: "rule-jumbo", name: "Jumbo", categoryId: "grocery", defaultType: "expense" },
  { id: "rule-lidl", name: "Lidl", categoryId: "grocery", defaultType: "expense" },
  { id: "rule-ns", name: "NS", categoryId: "transport", defaultType: "expense" },
  { id: "rule-salary", name: "Salary", categoryId: "salary", defaultType: "income" },
  { id: "rule-freelance", name: "Freelance", categoryId: "freelance", defaultType: "income" },
];
const DEFAULT_RECURRING_TRANSACTIONS: RecurringTransaction[] = [];
const DEFAULT_SMART_RULES: SmartRule[] = [];
const DEFAULT_VOICE_ALIASES: VoiceAlias[] = [];

function createTransaction(
  input: Omit<FinanceTransaction, "createdAt"> & { createdAt?: string },
): FinanceTransaction {
  return {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function createDefaultTransactions(): FinanceTransaction[] {
  return [
    createTransaction({
      id: "tx-salary-april",
      type: "income",
      amount: 4200,
      categoryId: "salary",
      merchant: "Salary April",
      date: "2026-04-01",
      note: "Monthly salary payout",
      createdAt: "2026-04-01T08:00:00.000Z",
    }),
    createTransaction({
      id: "tx-grocery-ah",
      type: "expense",
      amount: 84.5,
      categoryId: "grocery",
      merchant: "Albert Heijn",
      date: "2026-04-19",
      note: "Weekly groceries",
      createdAt: "2026-04-19T18:10:00.000Z",
    }),
    createTransaction({
      id: "tx-transport-ns",
      type: "expense",
      amount: 42,
      categoryId: "transport",
      merchant: "NS train pass",
      date: "2026-04-20",
      note: "Train pass top-up",
      createdAt: "2026-04-20T07:35:00.000Z",
    }),
    createTransaction({
      id: "tx-freelance",
      type: "income",
      amount: 650,
      categoryId: "freelance",
      merchant: "Freelance retainer",
      date: "2026-04-16",
      note: "Landing page refresh project",
      createdAt: "2026-04-16T11:20:00.000Z",
    }),
    createTransaction({
      id: "tx-bills",
      type: "expense",
      amount: 129.99,
      categoryId: "bills",
      merchant: "Utilities Bundle",
      date: "2026-04-12",
      createdAt: "2026-04-12T15:00:00.000Z",
    }),
  ];
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    saveToStorage(key, fallback);
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    saveToStorage(key, fallback);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function findCategoryIdByName(
  categories: FinanceCategory[],
  categoryName: string | undefined,
  type: TransactionType,
): string {
  if (!categoryName) {
    return type === "income" ? "other" : "grocery";
  }

  const normalizedName = categoryName.trim().toLowerCase();
  const matchedCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedName,
  );

  return matchedCategory?.id ?? (type === "income" ? "other" : "grocery");
}

function migrateTransactions(
  value: unknown,
  categories: FinanceCategory[],
): FinanceTransaction[] {
  if (!Array.isArray(value)) {
    return createDefaultTransactions();
  }

  const transactions = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<FinanceTransaction> & { category?: string };
      const type =
        candidate.type === "income" ? "income" : candidate.type === "expense" ? "expense" : null;
      const amount = Number(candidate.amount);
      const merchant = typeof candidate.merchant === "string" ? candidate.merchant.trim() : "";
      const date = typeof candidate.date === "string" ? candidate.date : "";

      if (!type || !Number.isFinite(amount) || amount <= 0 || !merchant || !date) {
        return null;
      }

      return createTransaction({
        id:
          typeof candidate.id === "string" && candidate.id
            ? candidate.id
            : `tx-${Date.now().toString(36)}`,
        type,
        amount,
        categoryId:
          typeof candidate.categoryId === "string" && candidate.categoryId
            ? candidate.categoryId
            : findCategoryIdByName(categories, candidate.category, type),
        merchant,
        note:
          typeof candidate.note === "string" && candidate.note.trim()
            ? candidate.note.trim()
            : undefined,
        date,
        appliedSmartRuleId:
          typeof candidate.appliedSmartRuleId === "string" && candidate.appliedSmartRuleId
            ? candidate.appliedSmartRuleId
            : undefined,
        appliedSmartRuleName:
          typeof candidate.appliedSmartRuleName === "string" && candidate.appliedSmartRuleName
            ? candidate.appliedSmartRuleName
            : undefined,
        createdAt:
          typeof candidate.createdAt === "string" && candidate.createdAt
            ? candidate.createdAt
            : `${date}T12:00:00.000Z`,
        updatedAt:
          typeof candidate.updatedAt === "string" && candidate.updatedAt
            ? candidate.updatedAt
            : undefined,
      });
    })
    .filter((transaction): transaction is FinanceTransaction => transaction !== null);

  // Return the validated list as-is (including empty).
  // Only the very first run (no key in storage) should get demo data — that
  // is handled by passing createDefaultTransactions() as the fallback in
  // loadFromStorage().  An explicitly empty array means the user has cleared
  // their data and we must respect that.
  return transactions;
}

function migrateCategories(value: unknown): FinanceCategory[] {
  if (!Array.isArray(value)) {
    return DEFAULT_FINANCE_CATEGORIES;
  }

  const categories = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<FinanceCategory>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        (candidate.type !== "income" &&
          candidate.type !== "expense" &&
          candidate.type !== "both") ||
        typeof candidate.icon !== "string" ||
        typeof candidate.color !== "string"
      ) {
        return null;
      }

      const monthlyBudget = Number(candidate.monthlyBudget);

      return {
        id: candidate.id,
        name: candidate.name,
        type: candidate.type,
        icon: candidate.icon,
        color: candidate.color,
        monthlyBudget: Number.isFinite(monthlyBudget) && monthlyBudget > 0 ? monthlyBudget : undefined,
      } satisfies FinanceCategory;
    })
    .filter((category): category is FinanceCategory => category !== null);

  return categories.length > 0 ? categories : DEFAULT_FINANCE_CATEGORIES;
}

function migrateMerchantRules(value: unknown): MerchantRule[] {
  if (!Array.isArray(value)) {
    return DEFAULT_MERCHANT_RULES;
  }

  const rules = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<MerchantRule> & { defaultCategoryId?: string };

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        (candidate.defaultType !== "income" && candidate.defaultType !== "expense")
      ) {
        return null;
      }

      const categoryId =
        typeof candidate.categoryId === "string" && candidate.categoryId
          ? candidate.categoryId
          : typeof candidate.defaultCategoryId === "string" && candidate.defaultCategoryId
            ? candidate.defaultCategoryId
            : "";

      if (!categoryId) {
        return null;
      }

      return {
        id: candidate.id,
        name: candidate.name,
        categoryId,
        defaultType: candidate.defaultType,
      } satisfies MerchantRule;
    })
    .filter((rule): rule is MerchantRule => rule !== null);

  return rules.length > 0 ? rules : DEFAULT_MERCHANT_RULES;
}

function migrateSettings(value: unknown): FinanceSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_FINANCE_SETTINGS;
  }

  const candidate = value as Partial<FinanceSettings>;

  if (
    candidate.currency !== "EUR" &&
    candidate.currency !== "USD" &&
    candidate.currency !== "GBP" &&
    candidate.currency !== "IRR"
  ) {
    return DEFAULT_FINANCE_SETTINGS;
  }

  return { currency: candidate.currency };
}

function ensureFinanceSeedData(): void {
  const categories = migrateCategories(
    loadFromStorage<unknown>(STORAGE_KEYS.financeCategories, DEFAULT_FINANCE_CATEGORIES),
  );
  const merchantRules = migrateMerchantRules(
    loadFromStorage<unknown>(STORAGE_KEYS.financeMerchantRules, DEFAULT_MERCHANT_RULES),
  );
  const settings = migrateSettings(
    loadFromStorage<unknown>(STORAGE_KEYS.financeSettings, DEFAULT_FINANCE_SETTINGS),
  );
  const recurringTransactions = migrateRecurringTransactions(
    loadFromStorage<unknown>(
      STORAGE_KEYS.financeRecurringTransactions,
      DEFAULT_RECURRING_TRANSACTIONS,
    ),
  );
  const smartRules = migrateSmartRules(
    loadFromStorage<unknown>(STORAGE_KEYS.financeSmartRules, DEFAULT_SMART_RULES),
  );
  const voiceAliases = migrateVoiceAliases(
    loadFromStorage<unknown>(STORAGE_KEYS.financeVoiceAliases, DEFAULT_VOICE_ALIASES),
  );
  const transactions = migrateTransactions(
    loadFromStorage<unknown>(STORAGE_KEYS.financeTransactions, createDefaultTransactions()),
    categories,
  );

  saveToStorage(STORAGE_KEYS.financeCategories, categories);
  saveToStorage(STORAGE_KEYS.financeMerchantRules, merchantRules);
  saveToStorage(STORAGE_KEYS.financeSettings, settings);
  saveToStorage(STORAGE_KEYS.financeRecurringTransactions, recurringTransactions);
  saveToStorage(STORAGE_KEYS.financeSmartRules, smartRules);
  saveToStorage(STORAGE_KEYS.financeVoiceAliases, voiceAliases);
  saveToStorage(STORAGE_KEYS.financeTransactions, transactions);
}

export function getTransactions(): FinanceTransaction[] {
  ensureFinanceSeedData();
  const categories = migrateCategories(
    loadFromStorage<unknown>(STORAGE_KEYS.financeCategories, DEFAULT_FINANCE_CATEGORIES),
  );
  return migrateTransactions(
    loadFromStorage<unknown>(STORAGE_KEYS.financeTransactions, createDefaultTransactions()),
    categories,
  );
}

export function saveTransactions(transactions: FinanceTransaction[]): void {
  saveToStorage(STORAGE_KEYS.financeTransactions, transactions);
}

export function getCategories(): FinanceCategory[] {
  ensureFinanceSeedData();
  return migrateCategories(
    loadFromStorage<unknown>(STORAGE_KEYS.financeCategories, DEFAULT_FINANCE_CATEGORIES),
  );
}

export function saveCategories(categories: FinanceCategory[]): void {
  saveToStorage(STORAGE_KEYS.financeCategories, categories);
}

export function getFinanceSettings(): FinanceSettings {
  ensureFinanceSeedData();
  return migrateSettings(
    loadFromStorage<unknown>(STORAGE_KEYS.financeSettings, DEFAULT_FINANCE_SETTINGS),
  );
}

export function saveFinanceSettings(settings: FinanceSettings): void {
  saveToStorage(STORAGE_KEYS.financeSettings, settings);
}

export function getMerchantRules(): MerchantRule[] {
  ensureFinanceSeedData();
  return migrateMerchantRules(
    loadFromStorage<unknown>(STORAGE_KEYS.financeMerchantRules, DEFAULT_MERCHANT_RULES),
  );
}

export function saveMerchantRules(rules: MerchantRule[]): void {
  saveToStorage(STORAGE_KEYS.financeMerchantRules, rules);
}

function migrateRecurringTransactions(value: unknown): RecurringTransaction[] {
  if (!Array.isArray(value)) {
    return DEFAULT_RECURRING_TRANSACTIONS;
  }

  const recurringTransactions = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<RecurringTransaction>;

      if (
        typeof candidate.id !== "string" ||
        (candidate.type !== "income" && candidate.type !== "expense") ||
        !Number.isFinite(Number(candidate.amount)) ||
        Number(candidate.amount) <= 0 ||
        typeof candidate.categoryId !== "string" ||
        typeof candidate.merchant !== "string" ||
        (candidate.repeat !== "daily" &&
          candidate.repeat !== "weekly" &&
          candidate.repeat !== "monthly" &&
          candidate.repeat !== "yearly") ||
        typeof candidate.startDate !== "string" ||
        typeof candidate.isActive !== "boolean" ||
        typeof candidate.createdAt !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        type: candidate.type,
        amount: Number(candidate.amount),
        categoryId: candidate.categoryId,
        merchant: candidate.merchant,
        note:
          typeof candidate.note === "string" && candidate.note.trim()
            ? candidate.note.trim()
            : undefined,
        repeat: candidate.repeat,
        startDate: candidate.startDate,
        endDate:
          typeof candidate.endDate === "string" && candidate.endDate
            ? candidate.endDate
            : undefined,
        isActive: candidate.isActive,
        lastGeneratedAt:
          typeof candidate.lastGeneratedAt === "string" && candidate.lastGeneratedAt
            ? candidate.lastGeneratedAt
            : undefined,
        createdAt: candidate.createdAt,
        updatedAt:
          typeof candidate.updatedAt === "string" && candidate.updatedAt
            ? candidate.updatedAt
            : undefined,
      } satisfies RecurringTransaction;
    })
    .filter((rule): rule is RecurringTransaction => rule !== null);

  return recurringTransactions;
}

function migrateSmartRules(value: unknown): SmartRule[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SMART_RULES;
  }

  const smartRules = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<SmartRule>;
      const conditions = Array.isArray(candidate.conditions)
        ? candidate.conditions
            .map((condition) => {
              if (!condition || typeof condition !== "object") {
                return null;
              }

              const conditionCandidate = condition as Partial<SmartRule["conditions"][number]>;

              if (
                typeof conditionCandidate.id !== "string" ||
                (conditionCandidate.field !== "merchant" &&
                  conditionCandidate.field !== "note" &&
                  conditionCandidate.field !== "amount" &&
                  conditionCandidate.field !== "type" &&
                  conditionCandidate.field !== "categoryId") ||
                (conditionCandidate.operator !== "contains" &&
                  conditionCandidate.operator !== "equals" &&
                  conditionCandidate.operator !== "startsWith" &&
                  conditionCandidate.operator !== "endsWith" &&
                  conditionCandidate.operator !== "greaterThan" &&
                  conditionCandidate.operator !== "lessThan") ||
                (typeof conditionCandidate.value !== "string" &&
                  typeof conditionCandidate.value !== "number")
              ) {
                return null;
              }

              return {
                id: conditionCandidate.id,
                field: conditionCandidate.field,
                operator: conditionCandidate.operator,
                value: conditionCandidate.value,
              };
            })
            .filter(
              (
                condition,
              ): condition is SmartRule["conditions"][number] => condition !== null,
            )
        : [];

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        (candidate.matchMode !== "all" && candidate.matchMode !== "any") ||
        typeof candidate.priority !== "number" ||
        typeof candidate.isActive !== "boolean" ||
        typeof candidate.createdAt !== "string" ||
        !candidate.action ||
        typeof candidate.action !== "object"
      ) {
        return null;
      }

      const action = {
        type:
          candidate.action.type === "income" || candidate.action.type === "expense"
            ? candidate.action.type
            : undefined,
        categoryId:
          typeof candidate.action.categoryId === "string" && candidate.action.categoryId
            ? candidate.action.categoryId
            : undefined,
        notePrefix:
          typeof candidate.action.notePrefix === "string" && candidate.action.notePrefix.trim()
            ? candidate.action.notePrefix.trim()
            : undefined,
      };

      return {
        id: candidate.id,
        name: candidate.name,
        conditions,
        matchMode: candidate.matchMode,
        action,
        priority: candidate.priority,
        isActive: candidate.isActive,
        createdAt: candidate.createdAt,
        updatedAt:
          typeof candidate.updatedAt === "string" && candidate.updatedAt
            ? candidate.updatedAt
            : undefined,
      } satisfies SmartRule;
    })
    .filter((rule): rule is SmartRule => rule !== null);

  return smartRules;
}

function migrateVoiceAliases(value: unknown): VoiceAlias[] {
  if (!Array.isArray(value)) {
    return DEFAULT_VOICE_ALIASES;
  }

  const voiceAliases = value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<VoiceAlias>;

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.heardText !== "string" ||
        typeof candidate.correctedText !== "string" ||
        (candidate.targetType !== "merchant" &&
          candidate.targetType !== "category" &&
          candidate.targetType !== "general") ||
        typeof candidate.createdAt !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        heardText: candidate.heardText.trim(),
        correctedText: candidate.correctedText.trim(),
        targetType: candidate.targetType,
        categoryId:
          typeof candidate.categoryId === "string" && candidate.categoryId
            ? candidate.categoryId
            : undefined,
        merchantRuleId:
          typeof candidate.merchantRuleId === "string" && candidate.merchantRuleId
            ? candidate.merchantRuleId
            : undefined,
        createdAt: candidate.createdAt,
        updatedAt:
          typeof candidate.updatedAt === "string" && candidate.updatedAt
            ? candidate.updatedAt
            : undefined,
      } satisfies VoiceAlias;
    })
    .filter((alias): alias is VoiceAlias => alias !== null);

  return voiceAliases;
}

export function getRecurringTransactions(): RecurringTransaction[] {
  ensureFinanceSeedData();
  return migrateRecurringTransactions(
    loadFromStorage<unknown>(
      STORAGE_KEYS.financeRecurringTransactions,
      DEFAULT_RECURRING_TRANSACTIONS,
    ),
  );
}

export function saveRecurringTransactions(
  recurringTransactions: RecurringTransaction[],
): void {
  saveToStorage(STORAGE_KEYS.financeRecurringTransactions, recurringTransactions);
}

export function getSmartRules(): SmartRule[] {
  ensureFinanceSeedData();
  return migrateSmartRules(
    loadFromStorage<unknown>(STORAGE_KEYS.financeSmartRules, DEFAULT_SMART_RULES),
  );
}

export function saveSmartRules(rules: SmartRule[]): void {
  saveToStorage(STORAGE_KEYS.financeSmartRules, rules);
}

export function getVoiceAliases(): VoiceAlias[] {
  ensureFinanceSeedData();
  return migrateVoiceAliases(
    loadFromStorage<unknown>(STORAGE_KEYS.financeVoiceAliases, DEFAULT_VOICE_ALIASES),
  );
}

export function saveVoiceAliases(aliases: VoiceAlias[]): void {
  saveToStorage(STORAGE_KEYS.financeVoiceAliases, aliases);
}

export function resetFinanceData(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.financeTransactions);
  window.localStorage.removeItem(STORAGE_KEYS.financeCategories);
  window.localStorage.removeItem(STORAGE_KEYS.financeSettings);
  window.localStorage.removeItem(STORAGE_KEYS.financeMerchantRules);
  window.localStorage.removeItem(STORAGE_KEYS.financeRecurringTransactions);
  window.localStorage.removeItem(STORAGE_KEYS.financeSmartRules);
  window.localStorage.removeItem(STORAGE_KEYS.financeVoiceAliases);
  ensureFinanceSeedData();
}

export interface FinanceSnapshot {
  categories: FinanceCategory[];
  merchantRules: MerchantRule[];
  recurringTransactions: RecurringTransaction[];
  smartRules: SmartRule[];
  voiceAliases: VoiceAlias[];
  settings: FinanceSettings;
  transactions: FinanceTransaction[];
}

export const financeStorage = {
  load(): FinanceSnapshot {
    ensureFinanceSeedData();
    const categories = migrateCategories(
      loadFromStorage<unknown>(STORAGE_KEYS.financeCategories, DEFAULT_FINANCE_CATEGORIES),
    );
    const merchantRules = migrateMerchantRules(
      loadFromStorage<unknown>(STORAGE_KEYS.financeMerchantRules, DEFAULT_MERCHANT_RULES),
    );
    const settings = migrateSettings(
      loadFromStorage<unknown>(STORAGE_KEYS.financeSettings, DEFAULT_FINANCE_SETTINGS),
    );
    const recurringTransactions = migrateRecurringTransactions(
      loadFromStorage<unknown>(
        STORAGE_KEYS.financeRecurringTransactions,
        DEFAULT_RECURRING_TRANSACTIONS,
      ),
    );
    const smartRules = migrateSmartRules(
      loadFromStorage<unknown>(STORAGE_KEYS.financeSmartRules, DEFAULT_SMART_RULES),
    );
    const voiceAliases = migrateVoiceAliases(
      loadFromStorage<unknown>(STORAGE_KEYS.financeVoiceAliases, DEFAULT_VOICE_ALIASES),
    );
    const transactions = migrateTransactions(
      loadFromStorage<unknown>(STORAGE_KEYS.financeTransactions, createDefaultTransactions()),
      categories,
    );

    return {
      categories,
      merchantRules,
      recurringTransactions,
      smartRules,
      voiceAliases,
      settings,
      transactions,
    };
  },
  getCategories,
  getFinanceSettings,
  getMerchantRules,
  getRecurringTransactions,
  getSmartRules,
  getVoiceAliases,
  getTransactions,
  loadFromStorage,
  resetFinanceData,
  saveCategories,
  saveFinanceSettings,
  saveMerchantRules,
  saveRecurringTransactions,
  saveSmartRules,
  saveVoiceAliases,
  saveToStorage,
  saveTransactions,
};
