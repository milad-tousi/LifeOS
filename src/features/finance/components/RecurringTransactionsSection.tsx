import { useState } from "react";
import { PencilLine, RotateCw, Repeat, Trash2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { FinanceCategory, FinanceCurrency, FinanceMerchantRule, RecurringTransaction } from "@/features/finance/types/finance.types";
import { getFinanceCategoryDisplayName, getFinanceTypeDisplayName, getRecurringRepeatDisplayName } from "@/features/finance/utils/finance.i18n";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { RecurringTransactionForm } from "@/features/finance/components/RecurringTransactionForm";
import { formatAppDate } from "@/i18n/formatters";
import { useI18n } from "@/i18n";
import { createId } from "@/lib/id";

interface RecurringTransactionsSectionProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  merchantRules: FinanceMerchantRule[];
  onAddRecurringTransaction: (recurringTransaction: RecurringTransaction) => void;
  onDeleteRecurringTransaction: (recurringTransactionId: string) => void;
  onUpdateRecurringTransaction: (recurringTransaction: RecurringTransaction) => void;
  recurringTransactions: RecurringTransaction[];
}

export function RecurringTransactionsSection({
  categories,
  currency,
  merchantRules,
  onAddRecurringTransaction,
  onDeleteRecurringTransaction,
  onUpdateRecurringTransaction,
  recurringTransactions,
}: RecurringTransactionsSectionProps): JSX.Element {
  const { language, t } = useI18n();
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const editingRule = recurringTransactions.find((rule) => rule.id === editingRuleId) ?? null;

  function getCategoryName(categoryId: string): string {
    return (
      getFinanceCategoryDisplayName(
        categories.find((category) => category.id === categoryId),
        t,
      )
    );
  }

  function formatRuleDate(dateValue: string): string {
    const safeDate = new Date(`${dateValue}T12:00:00`);

    if (Number.isNaN(safeDate.getTime())) {
      return dateValue;
    }

    return formatAppDate(safeDate, language);
  }

  return (
    <Card
      subtitle={t("finance.recurring.subtitle")}
      title={t("finance.recurring.title")}
    >
      <div className="finance-settings-section">
        <RecurringTransactionForm
          categories={categories}
          initialValue={editingRule ?? undefined}
          merchantRules={merchantRules}
          onCancel={editingRule ? () => setEditingRuleId(null) : undefined}
          onSubmit={(value) => {
            if (editingRule) {
              onUpdateRecurringTransaction({
                ...editingRule,
                ...value,
                updatedAt: new Date().toISOString(),
              });
              setEditingRuleId(null);
              return;
            }

            onAddRecurringTransaction({
              id: createId(),
              createdAt: new Date().toISOString(),
              ...value,
            });
          }}
        />

        {recurringTransactions.length === 0 ? (
          <div className="finance-empty-inline finance-empty-inline--recurring">
            <span className="finance-empty-inline__icon">
              <Repeat size={16} />
            </span>
            <strong>{t("finance.recurring.emptyTitle")}</strong>
            <p>{t("finance.recurring.emptySubtitle")}</p>
          </div>
        ) : (
          <div className="finance-recurring-list">
            {recurringTransactions.map((rule) => (
              <article className="finance-recurring-card" key={rule.id}>
                <div className="finance-recurring-card__main">
                  <div className="finance-recurring-card__header">
                    <div className="finance-recurring-card__title-group">
                      <strong>{rule.merchant}</strong>
                      <div className="finance-recurring-card__badges">
                        <span
                          className={`finance-transaction-card__type finance-transaction-card__type--${rule.type}`}
                        >
                          {getFinanceTypeDisplayName(rule.type, t)}
                        </span>
                        <span className="finance-transaction-card__chip finance-transaction-card__chip--category">
                          {getCategoryName(rule.categoryId)}
                        </span>
                        <span
                          className={`finance-budget-card__status ${
                            rule.isActive
                              ? "finance-budget-card__status--safe"
                              : "finance-budget-card__status--warning"
                          }`}
                        >
                          {rule.isActive ? t("finance.recurring.active") : t("finance.recurring.paused")}
                        </span>
                      </div>
                    </div>
                    <strong
                      className={`finance-transaction-card__amount finance-transaction-card__amount--${rule.type}`}
                    >
                      {rule.type === "income" ? "+" : "-"}
                      {formatMoney(rule.amount, currency)}
                    </strong>
                  </div>
                  <div className="finance-recurring-card__meta">
                    <span className="finance-transaction-card__chip">{getRecurringRepeatDisplayName(rule.repeat, t)}</span>
                    <span className="finance-transaction-card__chip">
                      {t("finance.recurring.starts")} {formatRuleDate(rule.startDate)}
                    </span>
                    {rule.endDate ? (
                      <span className="finance-transaction-card__chip">
                        {t("finance.recurring.ends")} {formatRuleDate(rule.endDate)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="finance-settings-row-actions">
                  <button
                    className="finance-settings-row-action"
                    onClick={() =>
                      onUpdateRecurringTransaction({
                        ...rule,
                        isActive: !rule.isActive,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    type="button"
                  >
                    <RotateCw size={15} />
                  </button>
                  <button
                    className="finance-settings-row-action"
                    onClick={() => setEditingRuleId(rule.id)}
                    type="button"
                  >
                    <PencilLine size={15} />
                  </button>
                  <button
                    className="finance-settings-row-action finance-settings-row-action--danger"
                    onClick={() => onDeleteRecurringTransaction(rule.id)}
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
