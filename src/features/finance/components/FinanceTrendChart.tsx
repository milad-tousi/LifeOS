import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { FinanceTrendPoint } from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface FinanceTrendChartProps {
  currency: FinanceCurrency;
  data: FinanceTrendPoint[];
}

export function FinanceTrendChart({
  currency,
  data,
}: FinanceTrendChartProps): JSX.Element {
  const hasData = data.some((item) => item.income > 0 || item.expenses > 0);
  const showDots = data.length <= 1;

  return (
    <section className="finance-dashboard-card finance-dashboard-card--wide">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>Income vs Expense Trend</h3>
          <p>Income, expenses, and net cashflow over time.</p>
        </div>
      </div>

      {hasData ? (
        <div className="finance-chart finance-chart--large">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 12 }}>
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
              <Legend />
              <Line
                dataKey="income"
                dot={showDots}
                name="Income"
                stroke="#16a34a"
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                dataKey="expenses"
                dot={showDots}
                name="Expenses"
                stroke="#ef4444"
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                dataKey="netCashflow"
                dot={showDots}
                name="Net cashflow"
                stroke="#2563eb"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
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
