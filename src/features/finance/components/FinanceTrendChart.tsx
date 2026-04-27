import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FinanceAnalyticsRange,
  FinanceTrendPoint,
} from "@/features/finance/utils/calculateFinanceAnalytics";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface FinanceTrendChartProps {
  currency: FinanceCurrency;
  data: FinanceTrendPoint[];
  onRangeChange: (range: FinanceAnalyticsRange) => void;
  range: FinanceAnalyticsRange;
}

const rangeOptions: Array<{ label: string; value: FinanceAnalyticsRange }> = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export function FinanceTrendChart({
  currency,
  data,
  onRangeChange,
  range,
}: FinanceTrendChartProps): JSX.Element {
  const hasData = data.some((item) => item.income > 0 || item.expenses > 0);

  return (
    <section className="finance-dashboard-card finance-dashboard-card--wide">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>Income vs Expense Trend</h3>
          <p>Income, expenses, and net cashflow over time.</p>
        </div>
        <div className="finance-range-toggle" aria-label="Analytics range">
          {rangeOptions.map((option) => (
            <button
              className={`finance-range-toggle__item${
                range === option.value ? " finance-range-toggle__item--active" : ""
              }`}
              key={option.value}
              onClick={() => onRangeChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="finance-chart finance-chart--large">
          <ResponsiveContainer height="100%" width="100%">
            <ComposedChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 12 }}>
              <defs>
                <linearGradient id="financeIncomeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="financeExpenseGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value: number) => compactMoney(value, currency)}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value: number | string, name: string) => [
                  formatMoney(Number(value), currency),
                  getSeriesLabel(name),
                ]}
              />
              <Area
                dataKey="income"
                fill="url(#financeIncomeGradient)"
                stroke="#16a34a"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="expenses"
                fill="url(#financeExpenseGradient)"
                stroke="#ef4444"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="netCashflow"
                dot={false}
                stroke="#2563eb"
                strokeWidth={2.5}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState description="Add income and expense transactions to see trend lines." />
      )}
    </section>
  );
}

export function ChartEmptyState({ description }: { description: string }): JSX.Element {
  return (
    <div className="finance-chart-empty">
      <strong>No chart data yet</strong>
      <p>{description}</p>
    </div>
  );
}

function getSeriesLabel(name: string): string {
  if (name === "netCashflow") {
    return "Net cashflow";
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}

function compactMoney(value: number, currency: FinanceCurrency): string {
  if (Math.abs(value) >= 1000) {
    return `${formatMoney(value / 1000, currency)}k`;
  }

  return formatMoney(value, currency);
}
