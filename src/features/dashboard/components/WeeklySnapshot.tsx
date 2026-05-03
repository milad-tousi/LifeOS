import { WeeklySnapshot as WeeklySnapshotData } from "@/features/dashboard/types/dashboard.types";
import { FinanceCurrency } from "@/features/finance/types/finance.types";
import { formatMoney } from "@/features/finance/utils/finance.format";
import { useI18n } from "@/i18n";

interface WeeklySnapshotProps {
  currency: FinanceCurrency;
  snapshot: WeeklySnapshotData;
}

export function WeeklySnapshot({
  currency,
  snapshot,
}: WeeklySnapshotProps): JSX.Element {
  const { t } = useI18n();
  const items = [
    { label: t("dashboard.tasksCompleted"), value: String(snapshot.tasksCompleted) },
    { label: t("dashboard.habitCompletion"), value: `${snapshot.habitCompletionRate}%` },
    { label: t("dashboard.goalProgress"), value: `${snapshot.goalProgressAverage}%` },
    { label: t("dashboard.financeNet"), value: formatMoney(snapshot.financeNet, currency) },
    { label: t("dashboard.reviewsCompleted"), value: String(snapshot.reviewsCompleted) },
  ];

  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h2>{t("dashboard.weeklySnapshot")}</h2>
          <p>{t("dashboard.weeklySnapshotSubtitle")}</p>
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
