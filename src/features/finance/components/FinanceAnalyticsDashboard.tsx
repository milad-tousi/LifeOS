import { useMemo, useState } from "react";
import { BudgetUsagePanel } from "@/features/finance/components/BudgetUsagePanel";
import { ExpenseBreakdownChart } from "@/features/finance/components/ExpenseBreakdownChart";
import { FinanceInsights } from "@/features/finance/components/FinanceInsights";
import { FinancePeriodFilter } from "@/features/finance/components/FinancePeriodFilter";
import { FinanceTrendChart } from "@/features/finance/components/FinanceTrendChart";
import { MonthlyCashflowChart } from "@/features/finance/components/MonthlyCashflowChart";
import {
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import {
  FinanceAnalyticsPeriod,
  calculateFinanceAnalytics,
} from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface FinanceAnalyticsDashboardProps {
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  /**
   * When provided, the dashboard uses this exact date range instead of the
   * period selector (weekly / monthly / etc.). The period buttons are hidden.
   */
  fromDate?: string;
  toDate?: string;
  transactions: FinanceTransaction[];
}

export function FinanceAnalyticsDashboard({
  categories,
  currency,
  fromDate,
  toDate,
  transactions,
}: FinanceAnalyticsDashboardProps): JSX.Element {
  const { t } = useI18n();

  // If an explicit date range is provided, force "custom" period (no period picker shown)
  const hasCustomRange = Boolean(fromDate && toDate);
  const [period, setPeriod] = useState<FinanceAnalyticsPeriod>("monthly");
  const activePeriod: FinanceAnalyticsPeriod = hasCustomRange ? "custom" : period;

  const analytics = useMemo(
    () =>
      calculateFinanceAnalytics({
        categories,
        period: activePeriod,
        customDateRange:
          hasCustomRange && fromDate && toDate
            ? { fromDate, toDate }
            : undefined,
        transactions,
      }),
    [categories, activePeriod, fromDate, toDate, hasCustomRange, transactions],
  );
  const hasTransactions = analytics.transactionCount > 0;

  return (
    <div className="finance-analytics-dashboard">
      <section className="finance-analytics-hero">
        <div>
          <span className="finance-analytics-hero__eyebrow">{t("finance.analytics")}</span>
          <h2>{t("finance.financialDashboard")}</h2>
          <p>{t("finance.financialDashboardDescription")}</p>
        </div>
        <div className="finance-analytics-hero__side">
          {/* Only show period buttons when no explicit date range is active */}
          {!hasCustomRange ? (
            <FinancePeriodFilter onChange={setPeriod} period={period} />
          ) : null}
          <div className="finance-analytics-hero__stats">
            <div>
              <span>{t("finance.totalIncome")}</span>
              <strong>{formatMoney(analytics.totalIncome, currency)}</strong>
            </div>
            <div>
              <span>{t("finance.totalExpenses")}</span>
              <strong>{formatMoney(analytics.totalExpenses, currency)}</strong>
            </div>
            <div>
              <span>{t("finance.netSavings")}</span>
              <strong>{formatMoney(analytics.netSavings, currency)}</strong>
            </div>
          </div>
        </div>
      </section>

      {!hasTransactions ? (
        <section className="finance-dashboard-card finance-dashboard-card--wide">
          <div className="finance-chart-empty finance-chart-empty--roomy">
            <strong>{t("finance.noAnalyticsData")}</strong>
            <p>{t("finance.noAnalyticsDataDescription")}</p>
          </div>
        </section>
      ) : null}

      <FinanceTrendChart currency={currency} data={analytics.incomeExpenseTrend} />

      <div className="finance-analytics-grid">
        <ExpenseBreakdownChart currency={currency} data={analytics.categoryBreakdown} />
        <BudgetUsagePanel budgetUsage={analytics.budgetUsage} currency={currency} />
      </div>

      <MonthlyCashflowChart currency={currency} data={analytics.monthlyCashflow} />

      <FinanceInsights analyticsInsights={analytics.smartInsights} currency={currency} />
    </div>
  );
}
