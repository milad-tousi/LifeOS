import { useState } from "react";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { FinanceAnalyticsTab } from "@/features/finance/components/FinanceAnalyticsTab";
import { FinanceOverviewTab } from "@/features/finance/components/FinanceOverviewTab";
import { FinanceSettingsEntry } from "@/features/finance/components/FinanceSettingsEntry";
import { FinanceSettingsModal } from "@/features/finance/components/FinanceSettingsModal";
import { FinanceTabs, FinanceTab } from "@/features/finance/components/FinanceTabs";
import { FinanceTransactionsTab } from "@/features/finance/components/FinanceTransactionsTab";
import { useFinanceState } from "@/features/finance/hooks/useFinanceState";

export function FinancePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    addCategory,
    addMerchantRule,
    addRecurringTransaction,
    addTransaction,
    addVoiceAlias,
    analytics,
    budgetUsage,
    categories,
    deleteTransaction,
    deleteCategory,
    deleteMerchantRule,
    deleteRecurringTransaction,
    deleteVoiceAlias,
    insights,
    isCategoryInUse,
    merchantRules,
    recurringTransactions,
    smartRules,
    settings,
    summary,
    transactions,
    voiceAliases,
    updateCategory,
    updateMerchantRule,
    updateRecurringTransaction,
    updateSettings,
    updateTransaction,
    updateVoiceAlias,
  } = useFinanceState();

  return (
    <div className="finance-page">
      <div className="finance-page__header">
        <ScreenHeader
          title="Finance"
          description="Track personal income and expenses in one place with a clearer manual workflow that is ready for smarter capture later."
        />
        <FinanceSettingsEntry onClick={() => setIsSettingsOpen(true)} />
      </div>

      <FinanceTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <FinanceOverviewTab
          budgetUsage={budgetUsage}
          categories={categories}
          currency={settings.currency}
          insights={insights}
          onOpenSettings={() => setIsSettingsOpen(true)}
          summary={summary}
          transactions={transactions}
        />
      ) : null}

      {activeTab === "transactions" ? (
        <FinanceTransactionsTab
          categories={categories}
          currency={settings.currency}
          merchantRules={merchantRules}
          onAddTransaction={addTransaction}
          onDeleteTransaction={deleteTransaction}
          onUpdateTransaction={updateTransaction}
          smartRules={smartRules}
          transactions={transactions}
          voiceAliases={voiceAliases}
        />
      ) : null}

      {activeTab === "analytics" ? (
        <FinanceAnalyticsTab
          analytics={analytics}
          budgetUsage={budgetUsage}
          categories={categories}
          currency={settings.currency}
        />
      ) : null}

      <FinanceSettingsModal
        categories={categories}
        isCategoryInUse={isCategoryInUse}
        isOpen={isSettingsOpen}
        merchantRules={merchantRules}
        onAddCategory={addCategory}
        onAddMerchantRule={addMerchantRule}
        onAddRecurringTransaction={addRecurringTransaction}
        onAddVoiceAlias={addVoiceAlias}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteCategory={deleteCategory}
        onDeleteMerchantRule={deleteMerchantRule}
        onDeleteRecurringTransaction={deleteRecurringTransaction}
        onDeleteVoiceAlias={deleteVoiceAlias}
        onUpdateRecurringTransaction={updateRecurringTransaction}
        onUpdateCategory={updateCategory}
        onUpdateMerchantRule={updateMerchantRule}
        onUpdateSettings={updateSettings}
        onUpdateVoiceAlias={updateVoiceAlias}
        recurringTransactions={recurringTransactions}
        voiceAliases={voiceAliases}
        currency={settings.currency}
        settings={settings}
      />
    </div>
  );
}
