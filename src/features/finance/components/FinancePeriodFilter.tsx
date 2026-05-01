import { FinanceAnalyticsPeriod } from "@/features/finance/utils/calculateFinanceAnalytics";

interface FinancePeriodFilterProps {
  onChange: (period: FinanceAnalyticsPeriod) => void;
  period: FinanceAnalyticsPeriod;
}

const periodOptions: Array<{ label: string; value: FinanceAnalyticsPeriod }> = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "All Time", value: "all-time" },
];

export function FinancePeriodFilter({
  onChange,
  period,
}: FinancePeriodFilterProps): JSX.Element {
  return (
    <div className="finance-range-toggle" aria-label="Analytics period">
      {periodOptions.map((option) => (
        <button
          className={`finance-range-toggle__item${
            period === option.value ? " finance-range-toggle__item--active" : ""
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
