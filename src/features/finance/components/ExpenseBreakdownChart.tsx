import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartEmptyState } from "@/features/finance/components/FinanceTrendChart";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { ExpenseBreakdownPoint } from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface ExpenseBreakdownChartProps {
  currency: FinanceCurrency;
  data: ExpenseBreakdownPoint[];
}

export function ExpenseBreakdownChart({
  currency,
  data,
}: ExpenseBreakdownChartProps): JSX.Element {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="finance-dashboard-card">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>Expense Breakdown</h3>
          <p>Category share for the selected period.</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="finance-breakdown">
          <div className="finance-chart finance-chart--donut">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.map((item) => (
                    <Cell fill={item.color} key={item.categoryId} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) => formatMoney(Number(value), currency)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="finance-breakdown__center">
              <span>Total</span>
              <strong>{formatMoney(total, currency)}</strong>
            </div>
          </div>

          <div className="finance-breakdown__legend">
            {data.map((item) => (
              <div className="finance-breakdown__row" key={item.categoryId}>
                <span className="finance-breakdown__swatch" style={{ backgroundColor: item.color }} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{Math.round(item.percentage)}% of expenses</span>
                </div>
                <b>{formatMoney(item.value, currency)}</b>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ChartEmptyState description="Expense categories will appear after you add transactions." />
      )}
    </section>
  );
}
