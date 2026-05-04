import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartEmptyState } from "@/features/finance/components/FinanceTrendChart";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { ExpenseBreakdownPoint } from "@/features/finance/utils/calculateFinanceAnalytics";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface ExpenseBreakdownChartProps {
  currency: FinanceCurrency;
  data: ExpenseBreakdownPoint[];
}

export function ExpenseBreakdownChart({
  currency,
  data,
}: ExpenseBreakdownChartProps): JSX.Element {
  const { t } = useI18n();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="finance-dashboard-card">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>{t("finance.expenseBreakdown")}</h3>
          <p>{t("finance.expenseBreakdownDescription")}</p>
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
                <Tooltip formatter={(value: unknown) => formatMoney(Number(value ?? 0), currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="finance-breakdown__center">
              <span>{t("finance.total")}</span>
              <strong>{formatMoney(total, currency)}</strong>
            </div>
          </div>

          <div className="finance-breakdown__legend">
            {data.map((item) => (
              <div className="finance-breakdown__row" key={item.categoryId}>
                <span className="finance-breakdown__swatch" style={{ backgroundColor: item.color }} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{t("finance.percentOfExpenses").replace("{value}", String(Math.round(item.percentage)))}</span>
                </div>
                <b>{formatMoney(item.value, currency)}</b>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ChartEmptyState description={t("finance.expenseBreakdownEmpty")} />
      )}
    </section>
  );
}
