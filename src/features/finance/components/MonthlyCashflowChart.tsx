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
import { useI18n } from "@/i18n";

interface MonthlyCashflowChartProps {
  currency: FinanceCurrency;
  data: MonthlyCashflowPoint[];
}

export function MonthlyCashflowChart({
  currency,
  data,
}: MonthlyCashflowChartProps): JSX.Element {
  const { t } = useI18n();
  const hasData = data.some((item) => item.income > 0 || item.expenses > 0);

  return (
    <section className="finance-dashboard-card finance-dashboard-card--wide">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>{t("finance.monthlyCashflow")}</h3>
          <p>{t("finance.monthlyCashflowDescription")}</p>
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
                formatter={(value: unknown, name: unknown) => [
                  formatMoney(Number(value ?? 0), currency),
                  getSeriesLabel(String(name), t),
                ]}
              />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name={t("finance.income")} radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name={t("finance.expenses")} radius={[8, 8, 0, 0]} />
              <Bar dataKey="netCashflow" fill="#2563eb" name={t("finance.netCashflow")} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState description={t("finance.monthlyCashflowEmpty")} />
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

function getSeriesLabel(name: string, t: (key: string) => string): string {
  if (name === "income") {
    return t("finance.income");
  }

  if (name === "expenses") {
    return t("finance.expenses");
  }

  return t("finance.netCashflow");
}
