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

interface FinanceTransactionsTabProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  merchantRules: FinanceMerchantRule[];
  onAddTransaction: (transaction: FinanceTransaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onUpdateTransaction: (transaction: FinanceTransaction) => void;
  smartRules: SmartRule[];
  transactions: FinanceTransaction[];
  voiceAliases: VoiceAlias[];
}

const DEFAULT_FILTERS: FinanceTransactionFilters = {
  type: "all",
  categoryId: "",
  fromDate: "",
  toDate: "",
  minAmount: "",
  maxAmount: "",
  quickDate: "all",
};

function getQuickDateRange(
  quickDate: FinanceTransactionFilters["quickDate"],
  now = new Date(),
): Pick<FinanceTransactionFilters, "fromDate" | "toDate"> {
  const end = new Date(now);
  const today = end.toISOString().slice(0, 10);

  switch (quickDate) {
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        fromDate: start.toISOString().slice(0, 10),
        toDate: today,
      };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        fromDate: start.toISOString().slice(0, 10),
        toDate: endOfLastMonth.toISOString().slice(0, 10),
      };
    }
    case "last-30-days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return {
        fromDate: start.toISOString().slice(0, 10),
        toDate: today,
      };
    }
    case "this-year": {
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        fromDate: start.toISOString().slice(0, 10),
        toDate: today,
      };
    }
    case "all":
    default:
      return { fromDate: "", toDate: "" };
  }
}

export function FinanceTransactionsTab({
  categories,
  currency,
  merchantRules,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  smartRules,
  transactions,
  voiceAliases,
}: FinanceTransactionsTabProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FinanceTransactionFilters>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<FinanceTransactionSortOption>("newest");
  const [transactionToEdit, setTransactionToEdit] = useState<FinanceTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    useState<FinanceTransaction | null>(null);

  useEffect(() => {
    if (filters.quickDate === "all") {
      return;
    }

    setFilters((current) => ({
      ...current,
      ...getQuickDateRange(current.quickDate),
    }));
  }, [filters.quickDate]);

  const filteredTransactions = useMemo(() => {
    const searchedTransactions = searchTransactions(transactions, searchQuery, categories);
    const filteredTransactions = filterTransactions(searchedTransactions, filters);

    return sortTransactions(filteredTransactions, sortOption);
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
    setFilters(DEFAULT_FILTERS);
    setSortOption("newest");
  }

  function handleUpdateTransaction(value: TransactionFormValue): void {
    if (!transactionToEdit) {
      return;
    }

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
        subtitle="Search, filter, sort, and manage your finance history without leaving this tab."
        title="Transactions"
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
              Minimum amount is higher than maximum amount, so that range is ignored safely.
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
