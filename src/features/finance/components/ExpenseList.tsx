import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Expense } from "@/domains/finance/types";
import { formatCurrency } from "@/lib/number";

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps): JSX.Element {
  if (expenses.length === 0) {
    return (
      <EmptyState
        title="No expenses yet"
        description="Expense records will appear here when finance is implemented."
      />
    );
  }

  return (
    <Card title="Expenses">
      <div className="page-list">
        {expenses.map((expense) => (
          <div key={expense.id} className="page-list__item">
            <div>
              <strong>{expense.category}</strong>
              <div className="text-muted">{expense.expenseDate}</div>
            </div>
            <strong>{formatCurrency(expense.amount)}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
