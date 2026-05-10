import { FormEvent, useState } from "react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";
import {
  createHabit,
  CreateHabitInput,
} from "@/features/habits/services/habits.storage";
import {
  AiFinanceAction,
  AiFinanceBudgetAction,
  AiFinanceHabitAction,
  AiFinanceTaskAction,
  FinancialAssistantBudgetSuggestion,
} from "@/features/finance/types/financialAssistant";
import { FinanceCategory } from "@/features/finance/types/finance.types";
import { useI18n } from "@/i18n";

interface FinanceActionConfirmModalProps {
  /** The AI action to confirm, or null when closed */
  action: AiFinanceAction | null;
  /** Legacy budget suggestion support (deterministic) */
  budgetSuggestion?: FinancialAssistantBudgetSuggestion | null;
  categories: FinanceCategory[];
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (category: FinanceCategory) => void;
}

// ── Habit sub-form ────────────────────────────────────────────────────────────

interface HabitFormState {
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "custom";
  tags: string;
}

function HabitConfirmForm({
  action,
  onClose,
  onSaved,
}: {
  action: AiFinanceHabitAction;
  onClose: () => void;
  onSaved: () => void;
}): JSX.Element {
  const { t } = useI18n();
  const [form, setForm] = useState<HabitFormState>({
    title: action.title,
    description: action.description,
    frequency: action.frequency,
    tags: action.tags.join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function patch(field: keyof HabitFormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError(t("finance.assistant.ai.confirm.habitTitleRequired"));
      return;
    }
    setSaving(true);
    try {
      const input: CreateHabitInput = {
        title,
        description: form.description.trim() || undefined,
        type: "binary",
        target: 1,
        frequency: form.frequency,
        daysOfWeek: [],
        category: "finance",
        archived: false,
      };
      createHabit(input);
      onSaved();
      onClose();
    } catch {
      setError(t("finance.assistant.ai.confirm.habitSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="finance-action-confirm__form" onSubmit={(e) => { void handleSubmit(e); }}>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="hcf-title">
          {t("finance.assistant.ai.confirm.habitTitle")}
        </label>
        <input
          className="auth-form__input"
          id="hcf-title"
          onChange={(e) => patch("title", e.target.value)}
          type="text"
          value={form.title}
        />
      </div>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="hcf-desc">
          {t("finance.assistant.ai.confirm.habitDescription")}
        </label>
        <textarea
          className="auth-form__input"
          id="hcf-desc"
          onChange={(e) => patch("description", e.target.value)}
          rows={3}
          value={form.description}
        />
      </div>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="hcf-freq">
          {t("finance.assistant.ai.confirm.habitFrequency")}
        </label>
        <select
          className="auth-form__input"
          id="hcf-freq"
          onChange={(e) => patch("frequency", e.target.value)}
          value={form.frequency}
        >
          <option value="daily">{t("finance.assistant.ai.confirm.freqDaily")}</option>
          <option value="weekly">{t("finance.assistant.ai.confirm.freqWeekly")}</option>
          <option value="custom">{t("finance.assistant.ai.confirm.freqCustom")}</option>
        </select>
      </div>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="hcf-tags">
          {t("finance.assistant.ai.confirm.tags")}
        </label>
        <input
          className="auth-form__input"
          id="hcf-tags"
          onChange={(e) => patch("tags", e.target.value)}
          placeholder="finance, budget"
          type="text"
          value={form.tags}
        />
      </div>
      {error ? <p className="auth-form__error">{error}</p> : null}
      <div className="finance-action-confirm__footer">
        <Button disabled={saving} type="submit">
          {saving
            ? t("finance.assistant.ai.confirm.saving")
            : t("finance.assistant.ai.confirm.createHabit")}
        </Button>
        <Button onClick={onClose} type="button" variant="ghost">
          {t("finance.assistant.ai.confirm.cancel")}
        </Button>
      </div>
    </form>
  );
}

// ── Budget sub-form ───────────────────────────────────────────────────────────

interface BudgetFormState {
  categoryName: string;
  monthlyLimit: string;
  reason: string;
}

function BudgetConfirmForm({
  action,
  categories,
  currency,
  onClose,
  onUpdateCategory,
}: {
  action: AiFinanceBudgetAction;
  categories: FinanceCategory[];
  currency: string;
  onClose: () => void;
  onUpdateCategory: (category: FinanceCategory) => void;
}): JSX.Element {
  const { t } = useI18n();
  const [form, setForm] = useState<BudgetFormState>({
    categoryName: action.categoryName,
    monthlyLimit: String(action.monthlyLimit),
    reason: action.reason,
  });
  const [error, setError] = useState("");

  function patch(field: keyof BudgetFormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    const limit = Number(form.monthlyLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      setError(t("finance.assistant.ai.confirm.budgetLimitInvalid"));
      return;
    }
    const matchedCategory = categories.find(
      (c) =>
        c.name.toLowerCase() === form.categoryName.toLowerCase() ||
        c.id.toLowerCase() === form.categoryName.toLowerCase(),
    );
    if (!matchedCategory) {
      setError(t("finance.assistant.ai.confirm.budgetCategoryNotFound").replace("{name}", form.categoryName));
      return;
    }
    onUpdateCategory({ ...matchedCategory, monthlyBudget: limit });
    onClose();
  }

  return (
    <form className="finance-action-confirm__form" onSubmit={handleSubmit}>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="bcf-cat">
          {t("finance.assistant.ai.confirm.budgetCategory")}
        </label>
        <select
          className="auth-form__input"
          id="bcf-cat"
          onChange={(e) => patch("categoryName", e.target.value)}
          value={form.categoryName}
        >
          {categories
            .filter((c) => c.type !== "income")
            .map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
      </div>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="bcf-limit">
          {t("finance.assistant.ai.confirm.budgetLimit")} ({currency})
        </label>
        <input
          className="auth-form__input"
          id="bcf-limit"
          min="1"
          onChange={(e) => patch("monthlyLimit", e.target.value)}
          step="0.01"
          type="number"
          value={form.monthlyLimit}
        />
      </div>
      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor="bcf-reason">
          {t("finance.assistant.ai.confirm.budgetReason")}
        </label>
        <textarea
          className="auth-form__input"
          id="bcf-reason"
          onChange={(e) => patch("reason", e.target.value)}
          rows={2}
          value={form.reason}
        />
      </div>
      {error ? <p className="auth-form__error">{error}</p> : null}
      <div className="finance-action-confirm__footer">
        <Button type="submit">
          {t("finance.assistant.ai.confirm.createBudget")}
        </Button>
        <Button onClick={onClose} type="button" variant="ghost">
          {t("finance.assistant.ai.confirm.cancel")}
        </Button>
      </div>
    </form>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function FinanceActionConfirmModal({
  action,
  categories,
  currency,
  isOpen,
  onClose,
  onUpdateCategory,
}: FinanceActionConfirmModalProps): JSX.Element | null {
  const { t } = useI18n();

  if (!isOpen || !action) return null;

  // Tasks reuse the existing TaskModal (handles its own storage)
  if (action.type === "task") {
    return (
      <TaskModal
        initialValues={{
          title: action.title,
          description: action.description,
          priority: action.priority ?? "medium",
          dueDate: action.dueDate ?? "",
          tags: action.tags,
        }}
        isOpen={isOpen}
        mode="create"
        onClose={onClose}
      />
    );
  }

  // Habits and budgets use ModalShell with custom forms
  const modalTitle =
    action.type === "habit"
      ? t("finance.assistant.ai.confirm.habitModalTitle")
      : t("finance.assistant.ai.confirm.budgetModalTitle");

  const modalDescription =
    action.type === "habit"
      ? t("finance.assistant.ai.confirm.habitModalDescription")
      : t("finance.assistant.ai.confirm.budgetModalDescription");

  return (
    <ModalShell
      isOpen={isOpen}
      onRequestClose={onClose}
      title={modalTitle}
      description={modalDescription}
    >
      {action.type === "habit" ? (
        <HabitConfirmForm
          action={action}
          onClose={onClose}
          onSaved={onClose}
        />
      ) : (
        <BudgetConfirmForm
          action={action}
          categories={categories}
          currency={currency}
          onClose={onClose}
          onUpdateCategory={onUpdateCategory}
        />
      )}
    </ModalShell>
  );
}
