import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card } from "@/components/common/Card";
import { FinanceCurrency, FinanceSummary } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface FinanceSummaryCardsProps {
  currency: FinanceCurrency;
  summary: FinanceSummary;
}

export function FinanceSummaryCards({
  currency,
  summary,
}: FinanceSummaryCardsProps): JSX.Element {
  const items = [
    {
      title: "Total Balance",
      value: formatMoney(summary.totalBalance, currency),
      tone: "balance",
      icon: <Wallet size={18} />,
    },
    {
      title: "Monthly Income",
      value: formatMoney(summary.monthlyIncome, currency),
      tone: "income",
      icon: <ArrowUpRight size={18} />,
    },
    {
      title: "Monthly Expenses",
      value: formatMoney(summary.monthlyExpenses, currency),
      tone: "expense",
      icon: <ArrowDownRight size={18} />,
    },
  ] as const;

  return (
    <div className="finance-summary-grid">
      {items.map((item) => (
        <Card key={item.title}>
          <div className={`finance-summary-card finance-summary-card--${item.tone}`}>
            <div className="finance-summary-card__icon">{item.icon}</div>
            <div className="finance-summary-card__content">
              <span className="finance-summary-card__label">{item.title}</span>
              <strong className="finance-summary-card__value">{item.value}</strong>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
