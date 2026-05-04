import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  findMerchantRuleMatch,
  getCategoriesForType,
} from "@/features/finance/finance.utils";
import {
  applySmartRules,
  findMatchingSmartRule,
  SmartRuleTransactionDraft,
} from "@/features/finance/services/finance.smartRules";
import {
  FinanceCategory,
  FinanceMerchantRule,
  FinanceTransaction,
  SmartRule,
  TransactionType,
} from "@/features/finance/types/finance.types";
import { getFinanceCategoryDisplayName, getFinanceTypeDisplayName } from "@/features/finance/utils/finance.i18n";
import { useI18n } from "@/i18n";

export interface TransactionFormValue {
  amount: number;
  appliedSmartRuleId?: string;
  appliedSmartRuleName?: string;
  categoryId: string;
  date: string;
  merchant: string;
  note?: string;
  type: TransactionType;
}

interface TransactionFormProps {
  categories: FinanceCategory[];
  initialValue?: FinanceTransaction;
  merchantRules: FinanceMerchantRule[];
  mode: "create" | "edit";
  onCancel?: () => void;
  prefillValue?: Partial<TransactionFormValue>;
  prefillVersion?: number;
  onSubmit: (value: TransactionFormValue) => void;
  smartRules: SmartRule[];
}

interface TransactionFormState {
  amount: string;
  categoryId: string;
  date: string;
  merchant: string;
  note: string;
  type: TransactionType;
  appliedSmartRuleId?: string;
  appliedSmartRuleName?: string;
}

interface TransactionFormErrors {
  amount?: string;
  categoryId?: string;
  date?: string;
  merchant?: string;
}

function getDefaultCategoryId(
  categories: FinanceCategory[],
  type: TransactionType,
  fallbackCategoryId?: string,
): string {
  return (
    getCategoriesForType(categories, type).find(
      (category) => category.id === fallbackCategoryId,
    )?.id ??
    getCategoriesForType(categories, type)[0]?.id ??
    categories[0]?.id ??
    ""
  );
}

function createInitialState(
  categories: FinanceCategory[],
  initialValue: FinanceTransaction | undefined,
  mode: "create" | "edit",
): TransactionFormState {
  if (mode === "edit" && initialValue) {
    return {
      type: initialValue.type,
      amount: String(initialValue.amount),
      categoryId: initialValue.categoryId,
      merchant: initialValue.merchant,
      date: initialValue.date,
      note: initialValue.note ?? "",
      appliedSmartRuleId: initialValue.appliedSmartRuleId,
      appliedSmartRuleName: initialValue.appliedSmartRuleName,
    };
  }

  return {
    type: "expense",
    amount: "",
    categoryId: getDefaultCategoryId(categories, "expense"),
    merchant: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
    appliedSmartRuleId: undefined,
    appliedSmartRuleName: undefined,
  };
}

export function TransactionForm({
  categories: allCategories,
  initialValue,
  merchantRules,
  mode,
  onCancel,
  prefillValue,
  prefillVersion,
  onSubmit,
  smartRules,
}: TransactionFormProps): JSX.Element {
  const { t } = useI18n();
  const [formState, setFormState] = useState<TransactionFormState>(() =>
    createInitialState(allCategories, initialValue, mode),
  );
  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [mappingHint, setMappingHint] = useState("");
  const [hasManualTypeOverride, setHasManualTypeOverride] = useState(false);
  const [hasManualCategoryOverride, setHasManualCategoryOverride] = useState(false);
  const [hasManualNoteOverride, setHasManualNoteOverride] = useState(false);
  const [hasMerchantBeenEdited, setHasMerchantBeenEdited] = useState(mode === "create");

  useEffect(() => {
    setFormState(createInitialState(allCategories, initialValue, mode));
    setErrors({});
    setMappingHint("");
    setHasManualTypeOverride(false);
    setHasManualCategoryOverride(false);
    setHasManualNoteOverride(false);
    setHasMerchantBeenEdited(mode === "create");
  }, [allCategories, initialValue, mode]);

  useEffect(() => {
    if (mode !== "create" || !prefillValue) {
      return;
    }

    setFormState((current) => ({
      ...current,
      amount:
        typeof prefillValue.amount === "number" && Number.isFinite(prefillValue.amount)
          ? String(prefillValue.amount)
          : current.amount,
      categoryId: prefillValue.categoryId ?? current.categoryId,
      date: prefillValue.date ?? current.date,
      merchant: prefillValue.merchant ?? current.merchant,
      note: prefillValue.note ?? current.note,
      type: prefillValue.type ?? current.type,
      appliedSmartRuleId: prefillValue.appliedSmartRuleId,
      appliedSmartRuleName: prefillValue.appliedSmartRuleName,
    }));
    setHasManualTypeOverride(false);
    setHasManualCategoryOverride(false);
    setHasManualNoteOverride(false);
    setHasMerchantBeenEdited(Boolean(prefillValue.merchant));
  }, [mode, prefillValue, prefillVersion]);

  const filteredCategories = useMemo(
    () => getCategoriesForType(allCategories, formState.type),
    [allCategories, formState.type],
  );

  useEffect(() => {
    if (!filteredCategories.some((category) => category.id === formState.categoryId)) {
      setFormState((current) => ({
        ...current,
        categoryId: getDefaultCategoryId(allCategories, current.type),
      }));
    }
  }, [allCategories, filteredCategories, formState.categoryId]);

  useEffect(() => {
    if (mode === "edit" && !hasMerchantBeenEdited) {
      return;
    }

    const transactionDraft: SmartRuleTransactionDraft = {
      amount: Number(formState.amount),
      categoryId: formState.categoryId,
      merchant: formState.merchant,
      note: formState.note,
      type: formState.type,
    };
    const matchedSmartRule = findMatchingSmartRule(transactionDraft, smartRules);

    if (matchedSmartRule) {
      const nextDraft = applySmartRules(transactionDraft, smartRules);

      setFormState((current) => ({
        ...current,
        type:
          !hasManualTypeOverride && nextDraft.type
            ? nextDraft.type
            : current.type,
        categoryId:
          !hasManualCategoryOverride && nextDraft.categoryId
            ? nextDraft.categoryId
            : current.categoryId,
        note:
          !hasManualNoteOverride && typeof nextDraft.note === "string"
            ? nextDraft.note
            : current.note,
        appliedSmartRuleId: nextDraft.appliedSmartRuleId,
        appliedSmartRuleName: nextDraft.appliedSmartRuleName,
      }));
      setMappingHint(t("finance.appliedSmartRule").replace("{name}", matchedSmartRule.name));
      return;
    }

    const matchedMerchantRule = findMerchantRuleMatch(merchantRules, formState.merchant);

    if (!matchedMerchantRule) {
      setFormState((current) => ({
        ...current,
        appliedSmartRuleId: undefined,
        appliedSmartRuleName: undefined,
      }));
      setMappingHint("");
      return;
    }

    setFormState((current) => ({
      ...current,
      type: !hasManualTypeOverride ? matchedMerchantRule.defaultType : current.type,
      categoryId:
        !hasManualCategoryOverride ? matchedMerchantRule.categoryId : current.categoryId,
      appliedSmartRuleId: undefined,
      appliedSmartRuleName: undefined,
    }));

    setMappingHint(t("finance.matchedMerchantRule").replace("{name}", matchedMerchantRule.name));
  }, [
    formState.amount,
    formState.categoryId,
    formState.merchant,
    formState.note,
    formState.type,
    hasManualCategoryOverride,
    hasManualNoteOverride,
    hasManualTypeOverride,
    hasMerchantBeenEdited,
    merchantRules,
    mode,
    smartRules,
    t,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const amount = Number(formState.amount);
    const nextErrors: TransactionFormErrors = {};

    if (!formState.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = t("finance.amountError");
    }

    if (!formState.categoryId) {
      nextErrors.categoryId = t("finance.categoryError");
    }

    if (!formState.merchant.trim()) {
      nextErrors.merchant = t("finance.merchantError");
    }

    if (!formState.date) {
      nextErrors.date = t("finance.dateError");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      type: formState.type,
      amount,
      categoryId: formState.categoryId,
      merchant: formState.merchant.trim(),
      note: formState.note.trim() || undefined,
      date: formState.date,
      appliedSmartRuleId: formState.appliedSmartRuleId,
      appliedSmartRuleName: formState.appliedSmartRuleName,
    });
  }

  return (
    <form className="finance-form" onSubmit={handleSubmit}>
      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">{t("finance.type")}</span>
        <select
          className="auth-form__input"
          onChange={(event) => {
            const nextType = event.target.value as TransactionType;
            setHasManualTypeOverride(true);
            setFormState((current) => ({
              ...current,
              type: nextType,
              categoryId: getDefaultCategoryId(allCategories, nextType, current.categoryId),
            }));
          }}
          value={formState.type}
        >
          <option value="expense">{getFinanceTypeDisplayName("expense", t)}</option>
          <option value="income">{getFinanceTypeDisplayName("income", t)}</option>
        </select>
      </label>

      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">{t("finance.amount")}</span>
        <input
          className="auth-form__input"
          inputMode="decimal"
          min="0"
          onChange={(event) =>
            setFormState((current) => ({ ...current, amount: event.target.value }))
          }
          placeholder="0.00"
          step="0.01"
          value={formState.amount}
        />
        {errors.amount ? <p className="auth-form__error">{errors.amount}</p> : null}
      </label>

      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">{t("finance.category")}</span>
        <select
          className="auth-form__input"
          onChange={(event) => {
            setHasManualCategoryOverride(true);
            setFormState((current) => ({ ...current, categoryId: event.target.value }));
          }}
          value={formState.categoryId}
        >
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {getFinanceCategoryDisplayName(category, t)}
            </option>
          ))}
        </select>
        {errors.categoryId ? <p className="auth-form__error">{errors.categoryId}</p> : null}
      </label>

      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">{t("finance.date")}</span>
        <input
          className="auth-form__input"
          onChange={(event) =>
            setFormState((current) => ({ ...current, date: event.target.value }))
          }
          type="date"
          value={formState.date}
        />
        {errors.date ? <p className="auth-form__error">{errors.date}</p> : null}
      </label>

      <label className="auth-form__field finance-form__wide finance-form__field">
        <span className="auth-form__label">{t("finance.merchantTitle")}</span>
        <input
          className="auth-form__input"
          onChange={(event) => {
            setHasMerchantBeenEdited(true);
            setFormState((current) => ({ ...current, merchant: event.target.value }));
          }}
          placeholder={t("finance.merchantPlaceholder")}
          value={formState.merchant}
        />
        {errors.merchant ? <p className="auth-form__error">{errors.merchant}</p> : null}
        {!errors.merchant && mappingHint ? (
          <p className="finance-form__hint">
            {mappingHint} {t("finance.mappingHintSuffix")}
          </p>
        ) : null}
      </label>

      <label className="auth-form__field finance-form__wide finance-form__field">
        <span className="auth-form__label">{t("finance.note")}</span>
        <textarea
          className="auth-form__input finance-form__note"
          onChange={(event) => {
            setHasManualNoteOverride(true);
            setFormState((current) => ({ ...current, note: event.target.value }));
          }}
          placeholder={t("finance.notePlaceholder")}
          value={formState.note}
        />
      </label>

      <div className="finance-form__footer">
        <span className="text-muted">
          {mode === "create" ? t("finance.manualEntryOnly") : t("finance.changesSaveInstantly")}
        </span>
        <div className="finance-form__actions">
          {onCancel ? (
            <button className="button button--secondary" onClick={onCancel} type="button">
              {t("common.cancel")}
            </button>
          ) : null}
          <button className="button button--primary" type="submit">
            {mode === "create" ? t("finance.addTransaction") : t("habits.saveChanges")}
          </button>
        </div>
      </div>
    </form>
  );
}
