import { useEffect, useMemo, useState } from "react";
import {
  calculateFinanceAnalytics,
  calculateFinanceSummary,
  sortTransactionsByDate,
} from "@/features/finance/finance.utils";
import { generateTransactionsFromRecurring } from "@/features/finance/services/finance.recurring";
import { financeStorage } from "@/features/finance/services/finance.storage";
import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceMerchantRule,
  FinanceSettings,
  FinanceSummary,
  FinanceTransaction,
  RecurringTransaction,
} from "@/features/finance/types";
import { MonthlyBudgetUsage, getMonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";
import { getFinanceInsights } from "@/features/finance/utils/finance.insights";

export interface UseFinanceStateResult {
  addCategory: (category: FinanceCategory) => void;
  addMerchantRule: (merchantRule: FinanceMerchantRule) => void;
  addRecurringTransaction: (recurringTransaction: RecurringTransaction) => void;
  addTransaction: (transaction: FinanceTransaction) => void;
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  deleteTransaction: (transactionId: string) => void;
  deleteCategory: (categoryId: string) => boolean;
  deleteMerchantRule: (merchantRuleId: string) => void;
  deleteRecurringTransaction: (recurringTransactionId: string) => void;
  insights: string[];
  isCategoryInUse: (categoryId: string) => boolean;
  merchantRules: FinanceMerchantRule[];
  recurringTransactions: RecurringTransaction[];
  settings: FinanceSettings;
  analytics: FinanceAnalyticsSummary;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
  updateCategory: (category: FinanceCategory) => void;
  updateMerchantRule: (merchantRule: FinanceMerchantRule) => void;
  updateRecurringTransaction: (recurringTransaction: RecurringTransaction) => void;
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
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(
    snapshot.recurringTransactions,
  );

  const summary = useMemo(() => calculateFinanceSummary(transactions), [transactions]);
  const budgetUsage = useMemo(
    () => getMonthlyBudgetUsage(transactions, categories),
    [transactions, categories],
  );
  const analytics = useMemo(
    () => calculateFinanceAnalytics(transactions, budgetUsage, recurringTransactions),
    [transactions, budgetUsage, recurringTransactions],
  );
  const insights = useMemo(
    () =>
      getFinanceInsights({
        budgetUsage,
        categories,
        currency: settings.currency,
        hasTransactions: transactions.length > 0,
        summary,
        topExpenseCategoryId: analytics.topExpenseCategoryId,
      }),
    [
      analytics.topExpenseCategoryId,
      budgetUsage,
      categories,
      settings.currency,
      summary,
      transactions.length,
    ],
  );

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

  useEffect(() => {
    financeStorage.saveRecurringTransactions(recurringTransactions);
  }, [recurringTransactions]);

  useEffect(() => {
    const {
      generatedTransactions,
      recurringTransactions: nextRecurringTransactions,
    } = generateTransactionsFromRecurring(recurringTransactions, transactions);

    if (generatedTransactions.length > 0) {
      setTransactions((currentTransactions) =>
        sortTransactionsByDate([...generatedTransactions, ...currentTransactions]),
      );
    }

    if (
      JSON.stringify(nextRecurringTransactions) !== JSON.stringify(recurringTransactions)
    ) {
      setRecurringTransactions(nextRecurringTransactions);
    }
  }, [recurringTransactions, transactions]);

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
    const isUsedByRecurringRule = recurringTransactions.some(
      (recurringTransaction) => recurringTransaction.categoryId === categoryId,
    );

    if (isCategoryInUse(categoryId) || isUsedByMerchantRule || isUsedByRecurringRule) {
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

  function addRecurringTransaction(recurringTransaction: RecurringTransaction): void {
    setRecurringTransactions((currentRecurringTransactions) => [
      ...currentRecurringTransactions,
      recurringTransaction,
    ]);
  }

  function updateRecurringTransaction(recurringTransaction: RecurringTransaction): void {
    setRecurringTransactions((currentRecurringTransactions) =>
      currentRecurringTransactions.map((currentRecurringTransaction) =>
        currentRecurringTransaction.id === recurringTransaction.id
          ? recurringTransaction
          : currentRecurringTransaction,
      ),
    );
  }

  function deleteRecurringTransaction(recurringTransactionId: string): void {
    setRecurringTransactions((currentRecurringTransactions) =>
      currentRecurringTransactions.filter(
        (recurringTransaction) => recurringTransaction.id !== recurringTransactionId,
      ),
    );
  }

  return {
    addCategory,
    addMerchantRule,
    addRecurringTransaction,
    addTransaction,
    budgetUsage,
    categories,
    deleteTransaction,
    deleteCategory,
    deleteMerchantRule,
    deleteRecurringTransaction,
    insights,
    isCategoryInUse,
    merchantRules,
    recurringTransactions,
    settings,
    analytics,
    summary,
    transactions,
    updateCategory,
    updateMerchantRule,
    updateRecurringTransaction,
    updateSettings,
    updateTransaction,
  };
}
