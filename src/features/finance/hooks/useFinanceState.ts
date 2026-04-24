import { useEffect, useMemo, useState } from "react";
import {
  calculateFinanceAnalytics,
  calculateFinanceSummary,
  sortTransactionsByDate,
} from "@/features/finance/finance.utils";
import { financeStorage } from "@/features/finance/services/finance.storage";
import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceMerchantRule,
  FinanceSettings,
  FinanceSummary,
  FinanceTransaction,
} from "@/features/finance/types";

export interface UseFinanceStateResult {
  addCategory: (category: FinanceCategory) => void;
  addMerchantRule: (merchantRule: FinanceMerchantRule) => void;
  addTransaction: (transaction: FinanceTransaction) => void;
  categories: FinanceCategory[];
  deleteTransaction: (transactionId: string) => void;
  deleteCategory: (categoryId: string) => boolean;
  deleteMerchantRule: (merchantRuleId: string) => void;
  isCategoryInUse: (categoryId: string) => boolean;
  merchantRules: FinanceMerchantRule[];
  settings: FinanceSettings;
  analytics: FinanceAnalyticsSummary;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
  updateCategory: (category: FinanceCategory) => void;
  updateMerchantRule: (merchantRule: FinanceMerchantRule) => void;
  updateSettings: (settings: FinanceSettings) => void;
  updateTransaction: (transaction: FinanceTransaction) => void;
}

export function useFinanceState(): UseFinanceStateResult {
  const [snapshot] = useState(() => financeStorage.load());
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() =>
    sortTransactionsByDate(snapshot.transactions),
  );
  const [categories, setCategories] = useState<FinanceCategory[]>(snapshot.categories);
  const [settings, setSettings] = useState<FinanceSettings>(snapshot.settings);
  const [merchantRules, setMerchantRules] = useState<FinanceMerchantRule[]>(
    snapshot.merchantRules,
  );

  const summary = useMemo(() => calculateFinanceSummary(transactions), [transactions]);
  const analytics = useMemo(() => calculateFinanceAnalytics(transactions), [transactions]);

  useEffect(() => {
    financeStorage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    financeStorage.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    financeStorage.saveFinanceSettings(settings);
  }, [settings]);

  useEffect(() => {
    financeStorage.saveMerchantRules(merchantRules);
  }, [merchantRules]);

  function addTransaction(transaction: FinanceTransaction): void {
    setTransactions((currentTransactions) =>
      sortTransactionsByDate([transaction, ...currentTransactions]),
    );
  }

  function updateTransaction(transaction: FinanceTransaction): void {
    setTransactions((currentTransactions) =>
      sortTransactionsByDate(
        currentTransactions.map((currentTransaction) =>
          currentTransaction.id === transaction.id ? transaction : currentTransaction,
        ),
      ),
    );
  }

  function deleteTransaction(transactionId: string): void {
    setTransactions((currentTransactions) =>
      currentTransactions.filter((transaction) => transaction.id !== transactionId),
    );
  }

  function addCategory(category: FinanceCategory): void {
    setCategories((currentCategories) => [...currentCategories, category]);
  }

  function updateCategory(category: FinanceCategory): void {
    setCategories((currentCategories) =>
      currentCategories.map((currentCategory) =>
        currentCategory.id === category.id ? category : currentCategory,
      ),
    );
  }

  function isCategoryInUse(categoryId: string): boolean {
    return transactions.some((transaction) => transaction.categoryId === categoryId);
  }

  function deleteCategory(categoryId: string): boolean {
    const isUsedByMerchantRule = merchantRules.some(
      (merchantRule) => merchantRule.categoryId === categoryId,
    );

    if (isCategoryInUse(categoryId) || isUsedByMerchantRule) {
      return false;
    }

    setCategories((currentCategories) =>
      currentCategories.filter((category) => category.id !== categoryId),
    );
    return true;
  }

  function updateSettings(nextSettings: FinanceSettings): void {
    setSettings(nextSettings);
  }

  function addMerchantRule(merchantRule: FinanceMerchantRule): void {
    setMerchantRules((currentRules) => [...currentRules, merchantRule]);
  }

  function updateMerchantRule(merchantRule: FinanceMerchantRule): void {
    setMerchantRules((currentRules) =>
      currentRules.map((currentRule) =>
        currentRule.id === merchantRule.id ? merchantRule : currentRule,
      ),
    );
  }

  function deleteMerchantRule(merchantRuleId: string): void {
    setMerchantRules((currentRules) =>
      currentRules.filter((merchantRule) => merchantRule.id !== merchantRuleId),
    );
  }

  return {
    addCategory,
    addMerchantRule,
    addTransaction,
    categories,
    deleteTransaction,
    deleteCategory,
    deleteMerchantRule,
    isCategoryInUse,
    merchantRules,
    settings,
    analytics,
    summary,
    transactions,
    updateCategory,
    updateMerchantRule,
    updateSettings,
    updateTransaction,
  };
}
