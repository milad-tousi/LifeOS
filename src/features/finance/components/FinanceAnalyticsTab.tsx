import { useMemo, useState } from "react";
import { BudgetUsagePanel } from "@/features/finance/components/BudgetUsagePanel";
import { ExpenseBreakdownChart } from "@/features/finance/components/ExpenseBreakdownChart";
import { FinanceInsights } from "@/features/finance/components/FinanceInsights";
import { FinanceTrendChart } from "@/features/finance/components/FinanceTrendChart";
import { MonthlyCashflowChart } from "@/features/finance/components/MonthlyCashflowChart";
import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import {
  FinanceAnalyticsRange,
  calculateFinanceAnalyticsDashboard,
} from "@/features/finance/utils/calculateFinanceAnalytics";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface FinanceAnalyticsTabProps {
  analytics: FinanceAnalyticsSummary;
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  transactions: FinanceTransaction[];
}

export function FinanceAnalyticsTab({
  analytics,
  budgetUsage,
  categories,
  currency,
  transactions,
}: FinanceAnalyticsTabProps): JSX.Element {
  const [range, setRange] = useState<FinanceAnalyticsRange>("monthly");
  const dashboard = useMemo(
    () =>
      calculateFinanceAnalyticsDashboard({
        budgetUsage,
        categories,
        range,
        transactions,
      }),
    [budgetUsage, categories, range, transactions],
  );

  const hasTransactions = transactions.length > 0;

  return (
    <div className="finance-tab-panel">
      <div className="finance-analytics-dashboard">
        <section className="finance-analytics-hero">
          <div>
            <span className="finance-analytics-hero__eyebrow">Analytics</span>
            <h2>Financial Dashboard</h2>
            <p>
              Explore cashflow, category concentration, budgets, and local insights from your
              transaction history.
            </p>
          </div>
          <div className="finance-analytics-hero__stats">
            <div>
              <span>Total income</span>
              <strong>{formatMoney(analytics.totalIncome, currency)}</strong>
            </div>
            <div>
              <span>Total expenses</span>
              <strong>{formatMoney(analytics.totalExpenses, currency)}</strong>
            </div>
            <div>
              <span>Net savings</span>
              <strong>{formatMoney(analytics.netSavings, currency)}</strong>
            </div>
          </div>
        </section>

        {!hasTransactions ? (
          <section className="finance-dashboard-card finance-dashboard-card--wide">
            <div className="finance-chart-empty finance-chart-empty--roomy">
              <strong>No analytics data yet</strong>
              <p>
                Add income and expense transactions to unlock charts, category breakdowns, and
                smart insights.
              </p>
            </div>
          </section>
        ) : null}

        <FinanceTrendChart
          currency={currency}
          data={dashboard.trend}
          onRangeChange={setRange}
          range={range}
        />

        <div className="finance-analytics-grid">
          <ExpenseBreakdownChart currency={currency} data={dashboard.expenseBreakdown} />
          <BudgetUsagePanel budgetUsage={budgetUsage} currency={currency} />
        </div>

        <MonthlyCashflowChart currency={currency} data={dashboard.monthlyCashflow} />

        <FinanceInsights
          analyticsInsights={dashboard.insights}
          currency={currency}
        />
      </div>
    </div>
  );
}
