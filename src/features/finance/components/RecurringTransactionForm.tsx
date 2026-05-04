import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import {
  findMerchantRuleMatch,
  getCategoriesForType,
} from "@/features/finance/finance.utils";
import {
  FinanceCategory,
  FinanceMerchantRule,
  RecurringTransaction,
  TransactionType,
} from "@/features/finance/types/finance.types";
import { getFinanceCategoryDisplayName, getFinanceTypeDisplayName, getRecurringRepeatDisplayName } from "@/features/finance/utils/finance.i18n";
import { useI18n } from "@/i18n";

interface RecurringTransactionFormProps {
  categories: FinanceCategory[];
  initialValue?: RecurringTransaction;
  merchantRules: FinanceMerchantRule[];
  onCancel?: () => void;
  onSubmit: (
    value: Omit<RecurringTransaction, "createdAt" | "id" | "lastGeneratedAt" | "updatedAt">,
  ) => void;
}

interface RecurringTransactionFormState {
  type: TransactionType;
  amount: string;
  categoryId: string;
  merchant: string;
  note: string;
  repeat: RecurringTransaction["repeat"];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface RecurringTransactionFormErrors {
  amount?: string;
  categoryId?: string;
  merchant?: string;
  repeat?: string;
  startDate?: string;
  endDate?: string;
}

function createInitialState(
  categories: FinanceCategory[],
  initialValue?: RecurringTransaction,
): RecurringTransactionFormState {
  if (initialValue) {
    return {
      type: initialValue.type,
      amount: String(initialValue.amount),
      categoryId: initialValue.categoryId,
      merchant: initialValue.merchant,
      note: initialValue.note ?? "",
      repeat: initialValue.repeat,
      startDate: initialValue.startDate,
      endDate: initialValue.endDate ?? "",
      isActive: initialValue.isActive,
    };
  }

  return {
    type: "expense",
    amount: "",
    categoryId:
      getCategoriesForType(categories, "expense")[0]?.id ?? categories[0]?.id ?? "",
    merchant: "",
    note: "",
    repeat: "monthly",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    isActive: true,
  };
}

export function RecurringTransactionForm({
  categories: allCategories,
  initialValue,
  merchantRules,
  onCancel,
  onSubmit,
}: RecurringTransactionFormProps): JSX.Element {
  const { t } = useI18n();
  const [formState, setFormState] = useState<RecurringTransactionFormState>(() =>
    createInitialState(allCategories, initialValue),
  );
  const [errors, setErrors] = useState<RecurringTransactionFormErrors>({});
  const [mappingHint, setMappingHint] = useState("");
  const [lastMatchedRuleId, setLastMatchedRuleId] = useState<string | null>(null);
  const [hasManualTypeOverride, setHasManualTypeOverride] = useState(false);
  const [hasManualCategoryOverride, setHasManualCategoryOverride] = useState(false);
  const [hasMerchantBeenEdited, setHasMerchantBeenEdited] = useState(!initialValue);

  useEffect(() => {
    setFormState(createInitialState(allCategories, initialValue));
    setErrors({});
    setMappingHint("");
    setLastMatchedRuleId(null);
    setHasManualTypeOverride(false);
    setHasManualCategoryOverride(false);
    setHasMerchantBeenEdited(!initialValue);
  }, [allCategories, initialValue]);

  const filteredCategories = useMemo(
    () => getCategoriesForType(allCategories, formState.type),
    [allCategories, formState.type],
  );

  useEffect(() => {
    if (!filteredCategories.some((category) => category.id === formState.categoryId)) {
      setFormState((current) => ({
        ...current,
        categoryId: filteredCategories[0]?.id ?? "",
      }));
    }
  }, [filteredCategories, formState.categoryId]);

  useEffect(() => {
    if (!hasMerchantBeenEdited) {
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
    setMappingHint(t("finance.matchedMerchantRule").replace("{name}", matchedRule.name));
    setLastMatchedRuleId(matchedRule.id);
  }, [
    formState.merchant,
    hasManualCategoryOverride,
    hasManualTypeOverride,
    hasMerchantBeenEdited,
    lastMatchedRuleId,
    merchantRules,
    t,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const amount = Number(formState.amount);
    const nextErrors: RecurringTransactionFormErrors = {};

    if (!formState.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = t("finance.amountError");
    }

    if (!formState.categoryId) {
      nextErrors.categoryId = t("finance.categoryError");
    }

    if (!formState.merchant.trim()) {
      nextErrors.merchant = t("finance.merchantError");
    }

    if (!formState.repeat) {
      nextErrors.repeat = t("finance.recurring.repeatError");
    }

    if (!formState.startDate) {
      nextErrors.startDate = t("finance.recurring.startDateError");
    }

    if (formState.endDate && formState.endDate < formState.startDate) {
      nextErrors.endDate = t("finance.recurring.endDateError");
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
      repeat: formState.repeat,
      startDate: formState.startDate,
      endDate: formState.endDate || undefined,
      isActive: formState.isActive,
    });
  }

  return (
    <div className="finance-recurring-form-card">
      <form
        className="finance-settings-form finance-settings-form--recurring"
        onSubmit={handleSubmit}
      >
        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--type">
          <span className="auth-form__label">{t("finance.form.type")}</span>
          <select
            className="auth-form__input finance-recurring-form__input"
            onChange={(event) => {
              const nextType = event.target.value as TransactionType;
              setHasManualTypeOverride(true);
              setFormState((current) => ({
                ...current,
                type: nextType,
                categoryId:
                  getCategoriesForType(allCategories, nextType).find(
                    (category) => category.id === current.categoryId,
                  )?.id ??
                  getCategoriesForType(allCategories, nextType)[0]?.id ??
                  "",
              }));
            }}
            value={formState.type}
          >
            <option value="expense">{getFinanceTypeDisplayName("expense", t)}</option>
            <option value="income">{getFinanceTypeDisplayName("income", t)}</option>
          </select>
        </label>

        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--amount">
          <span className="auth-form__label">{t("finance.form.amount")}</span>
          <input
            className="auth-form__input finance-recurring-form__input"
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

        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--category">
          <span className="auth-form__label">{t("finance.form.category")}</span>
          <select
            className="auth-form__input finance-recurring-form__input"
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

        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--repeat">
          <span className="auth-form__label">{t("finance.form.repeat")}</span>
          <select
            className="auth-form__input finance-recurring-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                repeat: event.target.value as RecurringTransaction["repeat"],
              }))
            }
            value={formState.repeat}
          >
            <option value="daily">{getRecurringRepeatDisplayName("daily", t)}</option>
            <option value="weekly">{getRecurringRepeatDisplayName("weekly", t)}</option>
            <option value="monthly">{getRecurringRepeatDisplayName("monthly", t)}</option>
            <option value="yearly">{getRecurringRepeatDisplayName("yearly", t)}</option>
          </select>
          {errors.repeat ? <p className="auth-form__error">{errors.repeat}</p> : null}
        </label>

        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--start-date">
          <span className="auth-form__label">{t("finance.form.startDate")}</span>
          <input
            className="auth-form__input finance-recurring-form__input finance-recurring-form__date"
            onChange={(event) =>
              setFormState((current) => ({ ...current, startDate: event.target.value }))
            }
            type="date"
            value={formState.startDate}
          />
          {errors.startDate ? <p className="auth-form__error">{errors.startDate}</p> : null}
        </label>

        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--end-date">
          <span className="auth-form__label">{t("finance.form.endDate")}</span>
          <input
            className="auth-form__input finance-recurring-form__input finance-recurring-form__date"
            onChange={(event) =>
              setFormState((current) => ({ ...current, endDate: event.target.value }))
            }
            type="date"
            value={formState.endDate}
          />
          {errors.endDate ? <p className="auth-form__error">{errors.endDate}</p> : null}
        </label>

        <label className="auth-form__field finance-recurring-form__field finance-recurring-form__field--merchant">
          <span className="auth-form__label">{t("finance.form.merchantTitle")}</span>
          <input
            className="auth-form__input finance-recurring-form__input"
            onChange={(event) => {
              setHasMerchantBeenEdited(true);
              setFormState((current) => ({ ...current, merchant: event.target.value }));
            }}
            placeholder={t("finance.recurring.merchantPlaceholder")}
            value={formState.merchant}
          />
          {errors.merchant ? <p className="auth-form__error">{errors.merchant}</p> : null}
          {!errors.merchant && mappingHint ? (
            <p className="finance-form__hint">
              {mappingHint} {t("finance.mappingHintSuffix")}
            </p>
          ) : null}
        </label>

        <label className="auth-form__field finance-settings-form__wide finance-recurring-form__field finance-recurring-form__field--note">
          <span className="auth-form__label">{t("finance.form.note")}</span>
          <textarea
            className="auth-form__input finance-form__note finance-recurring-form__textarea"
            onChange={(event) =>
              setFormState((current) => ({ ...current, note: event.target.value }))
            }
            placeholder={t("finance.recurring.notePlaceholder")}
            value={formState.note}
          />
        </label>

        <div className="auth-form__field finance-recurring-form__field finance-recurring-form__field--active">
          <span className="auth-form__label">{t("finance.form.active")}</span>
          <label className="finance-toggle" htmlFor="finance-recurring-active">
            <input
              checked={formState.isActive}
              id="finance-recurring-active"
              onChange={(event) =>
                setFormState((current) => ({ ...current, isActive: event.target.checked }))
              }
              type="checkbox"
            />
            <span
              aria-hidden="true"
              className={`finance-toggle__track${formState.isActive ? " finance-toggle__track--active" : ""}`}
            >
              <span className="finance-toggle__thumb" />
            </span>
          </label>
          <span className="text-muted finance-recurring-form__toggle-copy">
            {formState.isActive ? t("finance.recurring.activeDescription") : t("finance.recurring.pausedDescription")}
          </span>
        </div>

        <div className="finance-settings-form__actions finance-recurring-form__actions">
          <span className="text-muted finance-recurring-form__helper">
            {t("finance.recurring.autoGenerateHint")}
          </span>
          <div className="finance-settings-inline-actions finance-recurring-form__buttons">
            {onCancel ? (
              <Button onClick={onCancel} type="button" variant="secondary">
                {t("common.cancel")}
              </Button>
            ) : null}
            <Button className="finance-recurring-form__submit" type="submit">
              {initialValue ? t("finance.recurring.saveRule") : t("finance.recurring.addRule")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
