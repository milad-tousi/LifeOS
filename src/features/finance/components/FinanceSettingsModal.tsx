import { FormEvent, useMemo, useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ModalShell } from "@/components/common/ModalShell";
import { RecurringTransactionsSection } from "@/features/finance/components/RecurringTransactionsSection";
import { VoiceAliasesSection } from "@/features/finance/components/VoiceAliasesSection";
import { getFinanceIcon } from "@/features/finance/finance.icons";
import { getFinanceCategoryDisplayName } from "@/features/finance/utils/finance.i18n";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceMerchantRule,
  FinanceSettings,
  RecurringTransaction,
  VoiceAlias,
} from "@/features/finance/types/finance.types";
import { createId } from "@/lib/id";
import { useI18n } from "@/i18n";

interface FinanceSettingsModalProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  isCategoryInUse: (categoryId: string) => boolean;
  isOpen: boolean;
  merchantRules: FinanceMerchantRule[];
  onAddCategory: (category: FinanceCategory) => void;
  onAddMerchantRule: (merchantRule: FinanceMerchantRule) => void;
  onAddRecurringTransaction: (recurringTransaction: RecurringTransaction) => void;
  onAddVoiceAlias: (voiceAlias: VoiceAlias) => void;
  onClose: () => void;
  onDeleteCategory: (categoryId: string) => boolean;
  onDeleteMerchantRule: (merchantRuleId: string) => void;
  onDeleteRecurringTransaction: (recurringTransactionId: string) => void;
  onDeleteVoiceAlias: (voiceAliasId: string) => void;
  onUpdateCategory: (category: FinanceCategory) => void;
  onUpdateMerchantRule: (merchantRule: FinanceMerchantRule) => void;
  onUpdateRecurringTransaction: (recurringTransaction: RecurringTransaction) => void;
  onUpdateSettings: (settings: FinanceSettings) => void;
  onUpdateVoiceAlias: (voiceAlias: VoiceAlias) => void;
  recurringTransactions: RecurringTransaction[];
  settings: FinanceSettings;
  voiceAliases: VoiceAlias[];
}

interface CategoryFormState {
  name: string;
  type: FinanceCategory["type"];
  icon: string;
  color: string;
  monthlyBudget: string;
}

interface MerchantRuleFormState {
  name: string;
  categoryId: string;
  defaultType: FinanceMerchantRule["defaultType"];
}

const CATEGORY_TYPE_OPTIONS: FinanceCategory["type"][] = ["expense", "income", "both"];
const CURRENCY_OPTIONS: Array<{ value: FinanceCurrency; label: string }> = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "IRR", label: "IRR (﷼)" },
];
const CATEGORY_ICON_OPTIONS = [
  "grocery",
  "transport",
  "bills",
  "health",
  "entertainment",
  "travel",
  "shopping",
  "food",
  "salary",
  "freelance",
  "investment",
  "gift",
  "other",
] as const;

const DEFAULT_CATEGORY_FORM: CategoryFormState = {
  name: "",
  type: "expense",
  icon: "grocery",
  color: "#22c55e",
  monthlyBudget: "",
};

const DEFAULT_MERCHANT_FORM: MerchantRuleFormState = {
  name: "",
  categoryId: "",
  defaultType: "expense",
};

export function FinanceSettingsModal({
  categories,
  currency,
  isCategoryInUse,
  isOpen,
  merchantRules,
  onAddCategory,
  onAddMerchantRule,
  onAddRecurringTransaction,
  onAddVoiceAlias,
  onClose,
  onDeleteCategory,
  onDeleteMerchantRule,
  onDeleteRecurringTransaction,
  onDeleteVoiceAlias,
  onUpdateCategory,
  onUpdateMerchantRule,
  onUpdateRecurringTransaction,
  onUpdateSettings,
  onUpdateVoiceAlias,
  recurringTransactions,
  settings,
  voiceAliases,
}: FinanceSettingsModalProps): JSX.Element | null {
  const { t } = useI18n();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(DEFAULT_CATEGORY_FORM);
  const [categoryError, setCategoryError] = useState("");
  const [editingMerchantRuleId, setEditingMerchantRuleId] = useState<string | null>(null);
  const [merchantRuleForm, setMerchantRuleForm] = useState<MerchantRuleFormState>(() => ({
    ...DEFAULT_MERCHANT_FORM,
    categoryId:
      categories.find((category) => category.type === "expense" || category.type === "both")
        ?.id ?? "",
  }));
  const [merchantRuleError, setMerchantRuleError] = useState("");
  const [deleteCategoryMessage, setDeleteCategoryMessage] = useState("");

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) => {
        if (left.type === right.type) {
          return left.name.localeCompare(right.name);
        }

        return left.type.localeCompare(right.type);
      }),
    [categories],
  );

  const merchantCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === merchantRuleForm.defaultType || category.type === "both",
      ),
    [categories, merchantRuleForm.defaultType],
  );

  function resetCategoryForm(): void {
    setEditingCategoryId(null);
    setCategoryForm(DEFAULT_CATEGORY_FORM);
    setCategoryError("");
  }

  function getInitialMerchantCategoryId(
    nextType: FinanceMerchantRule["defaultType"],
  ): string {
    return (
      categories.find((category) => category.type === nextType || category.type === "both")?.id ??
      ""
    );
  }

  function resetMerchantRuleForm(): void {
    setEditingMerchantRuleId(null);
    setMerchantRuleForm({
      ...DEFAULT_MERCHANT_FORM,
      categoryId: getInitialMerchantCategoryId("expense"),
    });
    setMerchantRuleError("");
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const normalizedName = categoryForm.name.trim();
    if (!normalizedName) {
      setCategoryError(t("finance.settings.categoryNameRequired"));
      return;
    }

    const monthlyBudget = Number(categoryForm.monthlyBudget);
    if (
      categoryForm.monthlyBudget &&
      (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0)
    ) {
      setCategoryError(t("finance.settings.monthlyBudgetError"));
      return;
    }

    const hasDuplicateName = categories.some(
      (category) =>
        category.id !== editingCategoryId &&
        category.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (hasDuplicateName) {
      setCategoryError(t("finance.settings.duplicateCategoryName"));
      return;
    }

    const nextCategory: FinanceCategory = {
      id: editingCategoryId ?? createId(),
      name: normalizedName,
      type: categoryForm.type,
      icon: categoryForm.icon,
      color: categoryForm.color,
      monthlyBudget: categoryForm.monthlyBudget ? monthlyBudget : undefined,
    };

    if (editingCategoryId) {
      onUpdateCategory(nextCategory);
    } else {
      onAddCategory(nextCategory);
    }

    resetCategoryForm();
  }

  function handleMerchantRuleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const normalizedName = merchantRuleForm.name.trim();
    if (!normalizedName) {
      setMerchantRuleError(t("finance.settings.merchantNameRequired"));
      return;
    }

    if (!merchantRuleForm.categoryId) {
      setMerchantRuleError(t("finance.settings.defaultCategoryRequired"));
      return;
    }

    const hasDuplicateRule = merchantRules.some(
      (merchantRule) =>
        merchantRule.id !== editingMerchantRuleId &&
        merchantRule.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (hasDuplicateRule) {
      setMerchantRuleError(t("finance.settings.duplicateMerchantRule"));
      return;
    }

    const nextMerchantRule: FinanceMerchantRule = {
      id: editingMerchantRuleId ?? createId(),
      name: normalizedName,
      categoryId: merchantRuleForm.categoryId,
      defaultType: merchantRuleForm.defaultType,
    };

    if (editingMerchantRuleId) {
      onUpdateMerchantRule(nextMerchantRule);
    } else {
      onAddMerchantRule(nextMerchantRule);
    }

    resetMerchantRuleForm();
  }

  function startEditingCategory(category: FinanceCategory): void {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      monthlyBudget: category.monthlyBudget ? String(category.monthlyBudget) : "",
    });
    setCategoryError("");
  }

  function startEditingMerchantRule(merchantRule: FinanceMerchantRule): void {
    setEditingMerchantRuleId(merchantRule.id);
    setMerchantRuleForm({
      name: merchantRule.name,
      categoryId: merchantRule.categoryId,
      defaultType: merchantRule.defaultType,
    });
    setMerchantRuleError("");
  }

  function handleDeleteCategory(categoryId: string): void {
    const didDelete = onDeleteCategory(categoryId);

    if (!didDelete) {
      setDeleteCategoryMessage(
        t("finance.settings.categoryInUseMessage"),
      );
      return;
    }

    if (editingCategoryId === categoryId) {
      resetCategoryForm();
    }

    setDeleteCategoryMessage("");
  }

  return (
    <ModalShell
      description={t("finance.settingsDescription")}
      isOpen={isOpen}
      onRequestClose={onClose}
      size="wide"
      title={t("finance.financeSettings")}
    >
      <div className="finance-settings-modal">
        <Card
          subtitle={t("finance.currencySettingsDescription")}
          title={t("finance.currencySettings")}
        >
          <div className="finance-settings-section">
            <label className="auth-form__field finance-settings-currency-field">
              <span className="auth-form__label">{t("finance.currency")}</span>
              <select
                className="auth-form__input"
                onChange={(event) =>
                  onUpdateSettings({ currency: event.target.value as FinanceCurrency })
                }
                value={settings.currency}
              >
                {CURRENCY_OPTIONS.map((currencyOption) => (
                  <option key={currencyOption.value} value={currencyOption.value}>
                    {currencyOption.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card
          subtitle={t("finance.categoryManagementDescription")}
          title={t("finance.categoryManagement")}
        >
          <div className="finance-settings-section">
            <form className="finance-settings-form" onSubmit={handleCategorySubmit}>
              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.name")}</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={t("finance.settings.categoryNamePlaceholder")}
                  value={categoryForm.name}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.type")}</span>
                <select
                  className="auth-form__input"
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      type: event.target.value as FinanceCategory["type"],
                    }))
                  }
                  value={categoryForm.type}
                >
                  {CATEGORY_TYPE_OPTIONS.map((categoryType) => (
                    <option key={categoryType} value={categoryType}>
                      {getFinanceTypeLabel(categoryType, t)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.icon")}</span>
                <select
                  className="auth-form__input"
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, icon: event.target.value }))
                  }
                  value={categoryForm.icon}
                >
                  {CATEGORY_ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {getFinanceCategoryDisplayName(
                        {
                          id: icon,
                          name: icon,
                          type: "expense",
                          icon,
                          color: "#000000",
                        },
                        t,
                      )}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.color")}</span>
                <input
                  className="auth-form__input finance-settings-form__color"
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, color: event.target.value }))
                  }
                  type="color"
                  value={categoryForm.color}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.monthlyBudget")}</span>
                <input
                  className="auth-form__input"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      monthlyBudget: event.target.value,
                    }))
                  }
                  placeholder={t("finance.optional")}
                  step="0.01"
                  value={categoryForm.monthlyBudget}
                />
              </label>

              <div className="finance-settings-form__actions">
                {categoryError ? <p className="auth-form__error">{categoryError}</p> : null}
                <div className="finance-settings-inline-actions">
                  {editingCategoryId ? (
                    <Button onClick={resetCategoryForm} type="button" variant="secondary">
                      {t("common.cancel")}
                    </Button>
                  ) : null}
                  <Button type="submit">
                    {editingCategoryId ? t("finance.saveCategory") : t("finance.addCategory")}
                  </Button>
                </div>
              </div>
            </form>

            {deleteCategoryMessage ? (
              <p className="auth-form__error">{deleteCategoryMessage}</p>
            ) : null}

            <div className="finance-category-grid">
              {sortedCategories.map((category) => {
                const CategoryIcon = getFinanceIcon(category.icon);

                return (
                  <article className="finance-category-card" key={category.id}>
                    <div className="finance-category-card__topline">
                      <div className="finance-category-badge">
                        <span
                          className="finance-category-badge__icon"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          <CategoryIcon size={16} />
                        </span>
                        <div className="finance-category-badge__copy">
                          <strong>{getFinanceCategoryDisplayName(category, t)}</strong>
                          <span>{getFinanceTypeLabel(category.type, t)}</span>
                        </div>
                      </div>
                      <div className="finance-settings-row-actions">
                        <button
                          className="finance-settings-row-action"
                          onClick={() => startEditingCategory(category)}
                          type="button"
                        >
                          <PencilLine size={15} />
                        </button>
                        <button
                          className="finance-settings-row-action finance-settings-row-action--danger"
                          onClick={() => handleDeleteCategory(category.id)}
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="finance-category-card__meta">
                      <span
                        className="finance-category-card__swatch"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>
                        {typeof category.monthlyBudget === "number"
                          ? `${t("finance.budget")} ${category.monthlyBudget}`
                          : t("finance.noMonthlyBudget")}
                      </span>
                      {isCategoryInUse(category.id) ? (
                        <span className="finance-category-card__usage">{t("finance.usedInFinance")}</span>
                      ) : (
                        <span>{t("finance.safeToRemove")}</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Card>

        <Card
          subtitle={t("finance.rules.subtitle")}
          title={t("finance.rules.title")}
        >
          <div className="finance-settings-section">
            <form
              className="finance-settings-form finance-settings-form--merchant"
              onSubmit={handleMerchantRuleSubmit}
            >
              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.merchantName")}</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setMerchantRuleForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={t("finance.settings.merchantNamePlaceholder")}
                  value={merchantRuleForm.name}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.defaultType")}</span>
                <select
                  className="auth-form__input"
                  onChange={(event) =>
                    setMerchantRuleForm((current) => ({
                      ...current,
                      defaultType: event.target.value as FinanceMerchantRule["defaultType"],
                      categoryId: getInitialMerchantCategoryId(
                        event.target.value as FinanceMerchantRule["defaultType"],
                      ),
                    }))
                  }
                  value={merchantRuleForm.defaultType}
                >
                  <option value="expense">{t("finance.expense")}</option>
                  <option value="income">{t("finance.income")}</option>
                </select>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.defaultCategory")}</span>
                <select
                  className="auth-form__input"
                  onChange={(event) =>
                    setMerchantRuleForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  value={merchantRuleForm.categoryId}
                >
                  <option value="">{t("finance.selectCategory")}</option>
                  {merchantCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getFinanceCategoryDisplayName(category, t)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="finance-settings-form__actions">
                {merchantRuleError ? <p className="auth-form__error">{merchantRuleError}</p> : null}
                <div className="finance-settings-inline-actions">
                  {editingMerchantRuleId ? (
                    <Button onClick={resetMerchantRuleForm} type="button" variant="secondary">
                      {t("common.cancel")}
                    </Button>
                  ) : null}
                  <Button type="submit">
                    {editingMerchantRuleId ? t("finance.saveRule") : t("finance.addRule")}
                  </Button>
                </div>
              </div>
            </form>

            <div className="finance-merchant-rule-list">
              {merchantRules.map((merchantRule) => {
                const category = categories.find(
                  (candidateCategory) => candidateCategory.id === merchantRule.categoryId,
                );

                return (
                  <article className="finance-merchant-rule-card" key={merchantRule.id}>
                    <div>
                      <strong>{merchantRule.name}</strong>
                      <p>
                        {merchantRule.defaultType === "income" ? t("finance.income") : t("finance.expense")}
                        {" | "}
                        {getFinanceCategoryDisplayName(category, t)}
                      </p>
                    </div>
                    <div className="finance-settings-row-actions">
                      <button
                        className="finance-settings-row-action"
                        onClick={() => startEditingMerchantRule(merchantRule)}
                        type="button"
                      >
                        <PencilLine size={15} />
                      </button>
                      <button
                        className="finance-settings-row-action finance-settings-row-action--danger"
                        onClick={() => onDeleteMerchantRule(merchantRule.id)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Card>

        <RecurringTransactionsSection
          categories={categories}
          currency={currency}
          merchantRules={merchantRules}
          onAddRecurringTransaction={onAddRecurringTransaction}
          onDeleteRecurringTransaction={onDeleteRecurringTransaction}
          onUpdateRecurringTransaction={onUpdateRecurringTransaction}
          recurringTransactions={recurringTransactions}
        />

        <VoiceAliasesSection
          categories={categories}
          merchantRules={merchantRules}
          onAddVoiceAlias={onAddVoiceAlias}
          onDeleteVoiceAlias={onDeleteVoiceAlias}
          onUpdateVoiceAlias={onUpdateVoiceAlias}
        voiceAliases={voiceAliases}
      />
    </div>
  </ModalShell>
);
}

function getFinanceTypeLabel(
  type: FinanceCategory["type"],
  t: ReturnType<typeof useI18n>["t"],
): string {
  switch (type) {
    case "income":
      return t("finance.income");
    case "both":
      return t("finance.both");
    case "expense":
    default:
      return t("finance.expense");
  }
}
