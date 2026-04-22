import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { getCategoriesForType } from "@/features/finance/finance.utils";
import { FinanceTransaction, TransactionType } from "@/features/finance/types";
import { createId } from "@/lib/id";

interface FinanceQuickAddFormProps {
  onAddTransaction: (transaction: FinanceTransaction) => void;
}

interface FinanceQuickAddFormState {
  type: TransactionType;
  amount: string;
  category: string;
  merchant: string;
  date: string;
  note: string;
}

const DEFAULT_FORM_STATE: FinanceQuickAddFormState = {
  type: "expense",
  amount: "",
  category: "Grocery",
  merchant: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

export function FinanceQuickAddForm({
  onAddTransaction,
}: FinanceQuickAddFormProps): JSX.Element {
  const [formState, setFormState] = useState<FinanceQuickAddFormState>(DEFAULT_FORM_STATE);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => getCategoriesForType(formState.type),
    [formState.type],
  );

  useEffect(() => {
    if (!categories.includes(formState.category)) {
      setFormState((current) => ({
        ...current,
        category: categories[0] ?? "",
      }));
    }
  }, [categories, formState.category]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const amount = Number(formState.amount);

    if (!formState.type) {
      setError("Select a transaction type.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a positive amount.");
      return;
    }

    if (!formState.category) {
      setError("Choose a category.");
      return;
    }

    if (!formState.merchant.trim()) {
      setError("Merchant or title is required.");
      return;
    }

    if (!formState.date) {
      setError("Choose a date.");
      return;
    }

    onAddTransaction({
      id: createId(),
      type: formState.type,
      amount,
      category: formState.category,
      merchant: formState.merchant.trim(),
      date: formState.date,
      note: formState.note.trim() || undefined,
    });

    setFormState({
      ...DEFAULT_FORM_STATE,
      type: formState.type,
      category: getCategoriesForType(formState.type)[0] ?? "",
      date: new Date().toISOString().slice(0, 10),
    });
    setError("");
  }

  return (
    <Card
      subtitle="Add manual transactions now. Voice capture and smarter ingestion can plug into this same action flow later."
      title="Quick Add Transaction"
    >
      <div className="finance-form-shell">
        <form className="finance-form" onSubmit={handleSubmit}>
          <label className="auth-form__field finance-form__compact">
            <span className="auth-form__label">Type</span>
            <select
              className="auth-form__input"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  type: event.target.value as TransactionType,
                }))
              }
              value={formState.type}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label className="auth-form__field finance-form__compact">
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
          </label>

          <label className="auth-form__field finance-form__compact">
            <span className="auth-form__label">Category</span>
            <select
              className="auth-form__input"
              onChange={(event) =>
                setFormState((current) => ({ ...current, category: event.target.value }))
              }
              value={formState.category}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-form__field finance-form__compact">
            <span className="auth-form__label">Date</span>
            <input
              className="auth-form__input"
              onChange={(event) =>
                setFormState((current) => ({ ...current, date: event.target.value }))
              }
              type="date"
              value={formState.date}
            />
          </label>

          <label className="auth-form__field finance-form__wide">
            <span className="auth-form__label">Merchant / title</span>
            <input
              className="auth-form__input"
              onChange={(event) =>
                setFormState((current) => ({ ...current, merchant: event.target.value }))
              }
              placeholder="Albert Heijn, Salary, Freelance retainer..."
              value={formState.merchant}
            />
          </label>

          <label className="auth-form__field finance-form__wide">
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
            {error ? (
              <p className="auth-form__error">{error}</p>
            ) : (
              <span className="text-muted">Manual entry only for now.</span>
            )}
            <Button type="submit">Add Transaction</Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
