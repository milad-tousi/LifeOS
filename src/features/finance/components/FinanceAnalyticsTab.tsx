import { useMemo } from "react";
import { CalendarRange, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { FinanceAnalyticsDashboard } from "@/features/finance/components/FinanceAnalyticsDashboard";
import {
  FinanceAnalyticsSummary,
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/features/finance/types/finance.types";
import { MonthlyBudgetUsage } from "@/features/finance/utils/finance.budgets";
import {
  formatFinanceCycleLabel,
  getCurrentFinanceCycle,
} from "@/features/finance/utils/financeCycle.utils";
import { useFinanceDateRange } from "@/features/finance/hooks/useFinanceDateRange";
import { useI18n } from "@/i18n";

interface FinanceAnalyticsTabProps {
  analytics: FinanceAnalyticsSummary;
  budgetUsage: MonthlyBudgetUsage[];
  categories: FinanceCategory[];
  currency: FinanceCurrency;
  cycleStartDay: number;
  transactions: FinanceTransaction[];
}

export function FinanceAnalyticsTab({
  categories,
  currency,
  cycleStartDay,
  transactions,
}: FinanceAnalyticsTabProps): JSX.Element {
  const { t, language } = useI18n();
  const { dateRange, isCustomRange, setCustomRange, resetRange } =
    useFinanceDateRange(cycleStartDay);

  const cycleLabel = useMemo(() => {
    const cycle = getCurrentFinanceCycle(cycleStartDay);
    return formatFinanceCycleLabel(cycle, language);
  }, [cycleStartDay, language]);

  // Pre-filter transactions by the selected date range
  const rangedTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.date >= dateRange.fromDate && tx.date <= dateRange.toDate,
      ),
    [transactions, dateRange],
  );

  const isRtl = language === "fa";
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div className="finance-tab-panel">
      {/* ── Date range controls ─────────────────────────────────────────── */}
      <div
        className={`finance-cycle-filter-bar${isRtl ? " finance-cycle-filter-bar--rtl" : ""}`}
        dir={dir}
      >
        {/* Cycle label row */}
        <div className="finance-cycle-filter-bar__label" dir={dir}>
          <CalendarRange size={14} />
          <span>
            {isCustomRange
              ? t("finance.cycle.customRangeActive")
              : `${t("finance.cycle.currentCycleLabel")}: ${cycleLabel}`}
          </span>
        </div>

        {/* Date fields row — in RTL: From on RIGHT, To on LEFT */}
        <div className="finance-cycle-filter-bar__inputs" dir={dir}>
          {/* FROM date — visually first in LTR, last in RTL (rightmost) */}
          <div className="finance-cycle-filter-bar__field" dir={dir}>
            <span className="finance-cycle-filter-bar__field-label">{t("finance.cycle.fromDate")}</span>
            <LocalizedDateInput
              className="auth-form__input finance-cycle-filter-bar__date-input"
              onChange={(val) =>
                setCustomRange({ ...dateRange, fromDate: val })
              }
              value={dateRange.fromDate}
            />
          </div>

          {/* TO date — visually second in LTR, first in RTL (leftmost) */}
          <div className="finance-cycle-filter-bar__field" dir={dir}>
            <span className="finance-cycle-filter-bar__field-label">{t("finance.cycle.toDate")}</span>
            <LocalizedDateInput
              className="auth-form__input finance-cycle-filter-bar__date-input"
              onChange={(val) =>
                setCustomRange({ ...dateRange, toDate: val })
              }
              value={dateRange.toDate}
            />
          </div>

          {isCustomRange ? (
            <Button onClick={resetRange} type="button" variant="secondary">
              <RotateCcw size={13} />
              {t("finance.cycle.resetFilter")}
            </Button>
          ) : null}
        </div>
      </div>

      <FinanceAnalyticsDashboard
        categories={categories}
        currency={currency}
        transactions={rangedTransactions}
      />
    </div>
  );
}
