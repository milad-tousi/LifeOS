import { BudgetOverview } from "@/features/finance/components/BudgetOverview";
import { FinanceInsights } from "@/features/finance/components/FinanceInsights";
import { Card } from "@/components/common/Card";
import { FinanceSummaryCards } from "@/features/finance/components/FinanceSummaryCards";
import { FinanceTransactionsList } from "@/features/finance/components/FinanceTransactionsList";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceSummary,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";
import { FinanceLegacyInsight } from "@/features/finance/utils/finance.insights";
import { useI18n } from "@/i18n";

interface FinanceOverviewTabProps {
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  insights: FinanceLegacyInsight[];
  onOpenSettings: () => void;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export function FinanceOverviewTab({
  budgetUsage,
  categories,
  currency,
  insights,
  onOpenSettings,
  summary,
  transactions,
}: FinanceOverviewTabProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="finance-tab-panel">
      <FinanceSummaryCards currency={currency} summary={summary} />
      <BudgetOverview
        budgetUsage={budgetUsage}
        currency={currency}
        onOpenSettings={onOpenSettings}
      />
      <FinanceInsights insights={insights} />

      <Card
        subtitle={t("finance.activity.subtitle")}
        title={t("finance.activity.title")}
      >
        <FinanceTransactionsList
          categories={categories}
          currency={currency}
          emptyTitle={t("finance.activity.emptyTitle")}
          emptyDescription={t("finance.activity.emptySubtitle")}
          isEmbedded
          maxItems={4}
          transactions={transactions}
        />
      </Card>
    </div>
  );
}
