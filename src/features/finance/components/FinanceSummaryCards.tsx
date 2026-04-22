import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card } from "@/components/common/Card";
import { formatCurrency } from "@/lib/number";
import { FinanceSummary } from "@/features/finance/types";

interface FinanceSummaryCardsProps {
  summary: FinanceSummary;
}

export function FinanceSummaryCards({
  summary,
}: FinanceSummaryCardsProps): JSX.Element {
  const items = [
    {
      title: "Total Balance",
      value: formatCurrency(summary.totalBalance),
      tone: "balance",
      icon: <Wallet size={18} />,
    },
    {
      title: "Monthly Income",
      value: formatCurrency(summary.monthlyIncome),
      tone: "income",
      icon: <ArrowUpRight size={18} />,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(summary.monthlyExpenses),
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
