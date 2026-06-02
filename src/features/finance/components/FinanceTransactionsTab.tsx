import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/common/Card";
import { FinanceQuickAddForm } from "@/features/finance/components/FinanceQuickAddForm";
import { DeleteTransactionDialog } from "@/features/finance/components/DeleteTransactionDialog";
import { EditTransactionModal } from "@/features/finance/components/EditTransactionModal";
import { TransactionFilters } from "@/features/finance/components/TransactionFilters";
import { TransactionList } from "@/features/finance/components/TransactionList";
import { TransactionSummary } from "@/features/finance/components/TransactionSummary";
import { TransactionFormValue } from "@/features/finance/components/TransactionForm";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceMerchantRule,
  FinanceTransaction,
  SmartRule,
  VoiceAlias,
} from "@/features/finance/types/finance.types";
import {
  filterTransactions,
  FinanceTransactionFilters,
  FinanceTransactionSortOption,
  getFilteredTransactionSummary,
  searchTransactions,
  sortTransactions,
} from "@/features/finance/utils/finance.filters";
import {
  getCurrentFinanceCycle,
  toDateString,
} from "@/features/finance/utils/financeCycle.utils";
import { useI18n } from "@/i18n";

interface FinanceTransactionsTabProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  cycleStartDay: number;
  merchantRules: FinanceMerchantRule[];
  onAddTransaction: (transaction: FinanceTransaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onUpdateTransaction: (transaction: FinanceTransaction) => void;
  smartRules: SmartRule[];
  transactions: FinanceTransaction[];
  voiceAliases: VoiceAlias[];
}

function buildCycleFilter(cycleStartDay: number): FinanceTransactionFilters {
  const cycle = getCurrentFinanceCycle(cycleStartDay);
  return {
    type: "all",
    categoryId: "",
    fromDate: toDateString(cycle.startDate),
    toDate: toDateString(cycle.endDate),
    minAmount: "",
    maxAmount: "",
    quickDate: "all",
  };
}

export function FinanceTransactionsTab({
  categories,
  currency,
  cycleStartDay,
  merchantRules,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  smartRules,
  transactions,
  voiceAliases,
}: FinanceTransactionsTabProps): JSX.Element {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FinanceTransactionFilters>(
    () => buildCycleFilter(cycleStartDay),
  );
  const [sortOption, setSortOption] = useState<FinanceTransactionSortOption>("newest");
  const [transactionToEdit, setTransactionToEdit] = useState<FinanceTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    useState<FinanceTransaction | null>(null);

  // When cycleStartDay changes in settings, reset filters to new cycle range
  useEffect(() => {
    setFilters(buildCycleFilter(cycleStartDay));
  }, [cycleStartDay]);

  const filteredTransactions = useMemo(() => {
    const searched = searchTransactions(transactions, searchQuery, categories);
    const filtered = filterTransactions(searched, filters);
    return sortTransactions(filtered, sortOption);
  }, [categories, filters, searchQuery, sortOption, transactions]);

  const filteredSummary = useMemo(
    () => getFilteredTransactionSummary(filteredTransactions),
    [filteredTransactions],
  );

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filters.type !== "all" ||
    filters.categoryId !== "" ||
    filters.fromDate !== "" ||
    filters.toDate !== "" ||
    filters.minAmount.trim() !== "" ||
    filters.maxAmount.trim() !== "" ||
    filters.quickDate !== "all";

  const hasInvalidAmountRange =
    filters.minAmount.trim() !== "" &&
    filters.maxAmount.trim() !== "" &&
    Number(filters.minAmount) > Number(filters.maxAmount);

  function clearFilters(): void {
    setSearchQuery("");
    setFilters(buildCycleFilter(cycleStartDay));
    setSortOption("newest");
  }

  function handleUpdateTransaction(value: TransactionFormValue): void {
    if (!transactionToEdit) return;
    onUpdateTransaction({
      ...transactionToEdit,
      ...value,
      updatedAt: new Date().toISOString(),
    });
    setTransactionToEdit(null);
  }

  return (
    <div className="finance-tab-panel">
      <FinanceQuickAddForm
        categories={categories}
        merchantRules={merchantRules}
        onAddTransaction={onAddTransaction}
        smartRules={smartRules}
        voiceAliases={voiceAliases}
      />

      <Card
        subtitle={t("finance.transactionsDescription")}
        title={t("finance.transactions")}
      >
        <div className="finance-transaction-manager">
          <TransactionFilters
            categories={categories}
            filters={filters}
            onChangeFilters={setFilters}
            onClearFilters={clearFilters}
            onSearchChange={setSearchQuery}
            onSortChange={setSortOption}
            searchQuery={searchQuery}
            sortOption={sortOption}
          />

          {hasInvalidAmountRange ? (
            <p className="auth-form__error">
              {t("finance.invalidAmountRange")}
            </p>
          ) : null}

          <TransactionSummary currency={currency} summary={filteredSummary} />

          <TransactionList
            categories={categories}
            currency={currency}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onDelete={setTransactionToDelete}
            onEdit={setTransactionToEdit}
            transactions={filteredTransactions}
          />
        </div>
      </Card>

      <EditTransactionModal
        categories={categories}
        isOpen={transactionToEdit !== null}
        merchantRules={merchantRules}
        onClose={() => setTransactionToEdit(null)}
        onSubmit={handleUpdateTransaction}
        smartRules={smartRules}
        transaction={transactionToEdit}
      />

      <DeleteTransactionDialog
        isOpen={transactionToDelete !== null}
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) {
            onDeleteTransaction(transactionToDelete.id);
          }
          setTransactionToDelete(null);
        }}
      />
    </div>
  );
}
