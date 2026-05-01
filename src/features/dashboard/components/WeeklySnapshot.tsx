import { WeeklySnapshot as WeeklySnapshotData } from "@/features/dashboard/types/dashboard.types";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";

interface WeeklySnapshotProps {
  currency: FinanceCurrency;
  snapshot: WeeklySnapshotData;
}

export function WeeklySnapshot({
  currency,
  snapshot,
}: WeeklySnapshotProps): JSX.Element {
  const items = [
    { label: "Tasks completed", value: String(snapshot.tasksCompleted) },
    { label: "Habit completion", value: `${snapshot.habitCompletionRate}%` },
    { label: "Goal progress", value: `${snapshot.goalProgressAverage}%` },
    { label: "Finance net", value: formatMoney(snapshot.financeNet, currency) },
    { label: "Reviews completed", value: String(snapshot.reviewsCompleted) },
  ];

  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h2>Weekly Snapshot</h2>
          <p>A compact view of this week’s progress.</p>
        </div>
      </div>
      <div className="dashboard-weekly-grid">
        {items.map((item) => (
          <div className="dashboard-weekly-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
