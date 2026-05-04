import { FinanceAnalyticsPeriod } from "@/features/finance/utils/calculateFinanceAnalytics";
import { useI18n } from "@/i18n";

interface FinancePeriodFilterProps {
  onChange: (period: FinanceAnalyticsPeriod) => void;
  period: FinanceAnalyticsPeriod;
}

const periodOptions: Array<{ labelKey: string; value: FinanceAnalyticsPeriod }> = [
  { labelKey: "finance.periodWeekly", value: "weekly" },
  { labelKey: "finance.periodMonthly", value: "monthly" },
  { labelKey: "finance.periodYearly", value: "yearly" },
  { labelKey: "finance.periodAllTime", value: "all-time" },
];

export function FinancePeriodFilter({
  onChange,
  period,
}: FinancePeriodFilterProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="finance-range-toggle" aria-label={t("finance.analyticsPeriod")}>
      {periodOptions.map((option) => (
        <button
          className={`finance-range-toggle__item${
            period === option.value ? " finance-range-toggle__item--active" : ""
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}
