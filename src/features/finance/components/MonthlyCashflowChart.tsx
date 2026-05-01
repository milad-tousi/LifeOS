import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmptyState } from "@/features/finance/components/FinanceTrendChart";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { MonthlyCashflowPoint } from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface MonthlyCashflowChartProps {
  currency: FinanceCurrency;
  data: MonthlyCashflowPoint[];
}

export function MonthlyCashflowChart({
  currency,
  data,
}: MonthlyCashflowChartProps): JSX.Element {
  const hasData = data.some((item) => item.income > 0 || item.expenses > 0);

  return (
    <section className="finance-dashboard-card finance-dashboard-card--wide">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>Monthly Cashflow</h3>
          <p>Income and expenses compared month by month.</p>
        </div>
      </div>

      {hasData ? (
        <div className="finance-chart finance-chart--medium">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} margin={{ bottom: 8, left: 0, right: 12, top: 12 }}>
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
              <Bar dataKey="income" fill="#22c55e" name="Income" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
              <Bar dataKey="netCashflow" fill="#2563eb" name="Net cashflow" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState description="Monthly bars will appear once transactions are recorded." />
      )}
    </section>
  );
}

function compactMoney(value: number, currency: FinanceCurrency): string {
  if (Math.abs(value) >= 1000) {
    return `${formatMoney(value / 1000, currency)}k`;
  }

  return formatMoney(value, currency);
}

function getSeriesLabel(name: string): string {
  if (name === "income") {
    return "Income";
  }

  if (name === "expenses") {
    return "Expenses";
  }

  return "Net cashflow";
}
