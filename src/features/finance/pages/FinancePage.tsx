import { useState } from "react";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { FinanceAnalyticsTab } from "@/features/finance/components/FinanceAnalyticsTab";
import { FinanceOverviewTab } from "@/features/finance/components/FinanceOverviewTab";
import { FinanceSettingsEntry } from "@/features/finance/components/FinanceSettingsEntry";
import { FinanceTabs, FinanceTab } from "@/features/finance/components/FinanceTabs";
import { FinanceTransactionsTab } from "@/features/finance/components/FinanceTransactionsTab";
import { useFinanceState } from "@/features/finance/hooks/useFinanceState";

export function FinancePage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
  const { addTransaction, summary, transactions } = useFinanceState();

  return (
    <div className="finance-page">
      <div className="finance-page__header">
        <ScreenHeader
          title="Finance"
          description="Track personal income and expenses in one place with a clearer manual workflow that is ready for smarter capture later."
        />
        <FinanceSettingsEntry />
      </div>

      <FinanceTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <FinanceOverviewTab summary={summary} transactions={transactions} />
      ) : null}

      {activeTab === "transactions" ? (
        <FinanceTransactionsTab
          onAddTransaction={addTransaction}
          transactions={transactions}
        />
      ) : null}

      {activeTab === "analytics" ? <FinanceAnalyticsTab /> : null}
    </div>
  );
}
