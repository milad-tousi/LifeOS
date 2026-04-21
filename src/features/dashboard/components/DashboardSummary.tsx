import { Card } from "@/components/common/Card";
import { DashboardData } from "@/features/dashboard/hooks/useDashboardData";

interface DashboardSummaryProps {
  data: DashboardData;
}

export function DashboardSummary({ data }: DashboardSummaryProps): JSX.Element {
  const items = [
    { label: "Tasks", value: data.taskCount },
    { label: "Habits", value: data.habitCount },
    { label: "Goals", value: data.goalCount },
    { label: "Expenses", value: data.expenseCount },
  ];

  return (
    <Card title="System overview" subtitle="Lightweight counts from the local database">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              padding: "0.9rem",
              borderRadius: "1rem",
              background: "rgba(21, 111, 98, 0.08)",
            }}
          >
            <strong style={{ display: "block", fontSize: "1.4rem" }}>{item.value}</strong>
            <span className="muted">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

