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
import { useI18n } from "@/i18n";

interface FinanceTrendChartProps {
  currency: FinanceCurrency;
  data: FinanceTrendPoint[];
}

export function FinanceTrendChart({
  currency,
  data,
}: FinanceTrendChartProps): JSX.Element {
  const { t } = useI18n();
  const hasData = data.some((item) => item.income > 0 || item.expenses > 0);
  const showDots = data.length <= 1;

  return (
    <section className="finance-dashboard-card finance-dashboard-card--wide">
      <div className="finance-dashboard-card__header">
        <div>
          <h3>{t("finance.incomeExpenseTrend")}</h3>
          <p>{t("finance.incomeExpenseTrendDescription")}</p>
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
                formatter={(value: unknown, name: unknown) => [
                  formatMoney(Number(value ?? 0), currency),
                  getSeriesLabel(String(name), t),
                ]}
              />
              <Legend />
              <Line
                dataKey="income"
                dot={showDots}
                name={t("finance.income")}
                stroke="#16a34a"
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                dataKey="expenses"
                dot={showDots}
                name={t("finance.expenses")}
                stroke="#ef4444"
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                dataKey="netCashflow"
                dot={showDots}
                name={t("finance.netCashflow")}
                stroke="#2563eb"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmptyState description={t("finance.trendEmpty")} />
      )}
    </section>
  );
}

export function ChartEmptyState({ description }: { description: string }): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="finance-chart-empty">
      <strong>{t("finance.noChartData")}</strong>
      <p>{description}</p>
    </div>
  );
}

function getSeriesLabel(name: string, t: (key: string) => string): string {
  if (name === "netCashflow") {
    return t("finance.netCashflow");
  }

  if (name === "income") {
    return t("finance.income");
  }

  if (name === "expenses") {
    return t("finance.expenses");
  }

  return name;
}

function compactMoney(value: number, currency: FinanceCurrency): string {
  if (Math.abs(value) >= 1000) {
    return `${formatMoney(value / 1000, currency)}k`;
  }

  return formatMoney(value, currency);
}
