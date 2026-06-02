import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
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
import {
  formatFinanceCycleLabel,
  getCurrentFinanceCycle,
  isInCycleRange,
} from "@/features/finance/utils/financeCycle.utils";
import { useI18n } from "@/i18n";

interface FinanceOverviewTabProps {
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  cycleStartDay: number;
  insights: FinanceLegacyInsight[];
  onOpenSettings: () => void;
  summary: FinanceSummary;
  transactions: FinanceTransaction[];
}

export function FinanceOverviewTab({
  budgetUsage,
  categories,
  currency,
  cycleStartDay,
  insights,
  onOpenSettings,
  summary,
  transactions,
}: FinanceOverviewTabProps): JSX.Element {
  const { t, language } = useI18n();

  const cycleRange = useMemo(
    () => getCurrentFinanceCycle(cycleStartDay),
    [cycleStartDay],
  );

  const cycleLabel = useMemo(
    () => formatFinanceCycleLabel(cycleRange, language),
    [cycleRange, language],
  );

  // Filter recent activity to the current cycle only
  const cycleTransactions = useMemo(
    () =>
      transactions.filter((tx) =>
        isInCycleRange(tx.date, cycleRange.startDate, cycleRange.endDate),
      ),
    [transactions, cycleRange],
  );

  return (
    <div className="finance-tab-panel">
      {/* Cycle label banner */}
      <div className={`finance-cycle-banner${language === "fa" ? " finance-cycle-banner--rtl" : ""}`}>
        <CalendarRange size={15} />
        <span className="finance-cycle-banner__label">
          {t("finance.cycle.currentCycleLabel")}:
        </span>
        <span className="finance-cycle-banner__range">{cycleLabel}</span>
      </div>

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
          transactions={cycleTransactions}
        />
      </Card>
    </div>
  );
}
