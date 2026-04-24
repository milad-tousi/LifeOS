import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  findMerchantRuleMatch,
  getCategoriesForType,
} from "@/features/finance/finance.utils";
import {
  FinanceCategory,
  FinanceMerchantRule,
  FinanceTransaction,
  TransactionType,
} from "@/features/finance/types/finance.types";

export interface TransactionFormValue {
  amount: number;
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
  onSubmit: (value: TransactionFormValue) => void;
}

interface TransactionFormState {
  amount: string;
  categoryId: string;
  date: string;
  merchant: string;
  note: string;
  type: TransactionType;
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
    };
  }

  return {
    type: "expense",
    amount: "",
    categoryId: getDefaultCategoryId(categories, "expense"),
    merchant: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  };
}

export function TransactionForm({
  categories: allCategories,
  initialValue,
  merchantRules,
  mode,
  onCancel,
  onSubmit,
}: TransactionFormProps): JSX.Element {
  const [formState, setFormState] = useState<TransactionFormState>(() =>
    createInitialState(allCategories, initialValue, mode),
  );
  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [mappingHint, setMappingHint] = useState("");
  const [lastMatchedRuleId, setLastMatchedRuleId] = useState<string | null>(null);
  const [hasManualTypeOverride, setHasManualTypeOverride] = useState(false);
  const [hasManualCategoryOverride, setHasManualCategoryOverride] = useState(false);
  const [hasMerchantBeenEdited, setHasMerchantBeenEdited] = useState(mode === "create");

  useEffect(() => {
    setFormState(createInitialState(allCategories, initialValue, mode));
    setErrors({});
    setMappingHint("");
    setLastMatchedRuleId(null);
    setHasManualTypeOverride(false);
    setHasManualCategoryOverride(false);
    setHasMerchantBeenEdited(mode === "create");
  }, [allCategories, initialValue, mode]);

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

    const matchedRule = findMerchantRuleMatch(merchantRules, formState.merchant);

    if (!matchedRule) {
      setMappingHint("");
      setLastMatchedRuleId(null);
      return;
    }

    const isDifferentMatch = matchedRule.id !== lastMatchedRuleId;

    setFormState((current) => ({
      ...current,
      type:
        isDifferentMatch || !hasManualTypeOverride
          ? matchedRule.defaultType
          : current.type,
      categoryId:
        isDifferentMatch || !hasManualCategoryOverride
          ? matchedRule.categoryId
          : current.categoryId,
    }));

    setMappingHint(`Matched merchant rule for ${matchedRule.name}.`);
    setLastMatchedRuleId(matchedRule.id);
  }, [
    formState.merchant,
    hasManualCategoryOverride,
    hasManualTypeOverride,
    hasMerchantBeenEdited,
    lastMatchedRuleId,
    merchantRules,
    mode,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const amount = Number(formState.amount);
    const nextErrors: TransactionFormErrors = {};

    if (!formState.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = "Enter an amount greater than 0.";
    }

    if (!formState.categoryId) {
      nextErrors.categoryId = "Choose a category.";
    }

    if (!formState.merchant.trim()) {
      nextErrors.merchant = "Merchant or title is required.";
    }

    if (!formState.date) {
      nextErrors.date = "Choose a date.";
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
    });
  }

  return (
    <form className="finance-form" onSubmit={handleSubmit}>
      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">Type</span>
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
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>

      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">Amount</span>
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
        <span className="auth-form__label">Category</span>
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
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? <p className="auth-form__error">{errors.categoryId}</p> : null}
      </label>

      <label className="auth-form__field finance-form__compact finance-form__field">
        <span className="auth-form__label">Date</span>
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
        <span className="auth-form__label">Merchant / title</span>
        <input
          className="auth-form__input"
          onChange={(event) => {
            setHasMerchantBeenEdited(true);
            setFormState((current) => ({ ...current, merchant: event.target.value }));
          }}
          placeholder="Vomar 30 euro, Salary April, NS train pass..."
          value={formState.merchant}
        />
        {errors.merchant ? <p className="auth-form__error">{errors.merchant}</p> : null}
        {!errors.merchant && mappingHint ? (
          <p className="finance-form__hint">
            {mappingHint} Manual changes stay in place until a different merchant rule matches.
          </p>
        ) : null}
      </label>

      <label className="auth-form__field finance-form__wide finance-form__field">
        <span className="auth-form__label">Note</span>
        <textarea
          className="auth-form__input finance-form__note"
          onChange={(event) =>
            setFormState((current) => ({ ...current, note: event.target.value }))
          }
          placeholder="Optional context, project name, or reminder"
          value={formState.note}
        />
      </label>

      <div className="finance-form__footer">
        <span className="text-muted">
          {mode === "create" ? "Manual entry only for now." : "Changes save instantly to your local finance history."}
        </span>
        <div className="finance-form__actions">
          {onCancel ? (
            <button className="button button--secondary" onClick={onCancel} type="button">
              Cancel
            </button>
          ) : null}
          <button className="button button--primary" type="submit">
            {mode === "create" ? "Add Transaction" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
