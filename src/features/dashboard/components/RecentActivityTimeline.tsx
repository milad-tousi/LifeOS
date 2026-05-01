import { CheckCircle2, CircleDollarSign, Flag, Repeat2, ScrollText, SquarePlus } from "lucide-react";
import { DashboardEmptyState } from "@/features/dashboard/components/EmptyState";
import { DashboardActivityItem } from "@/features/dashboard/types/dashboard.types";

interface RecentActivityTimelineProps {
  items: DashboardActivityItem[];
  onNavigate: (path: string) => void;
}

export function RecentActivityTimeline({
  items,
  onNavigate,
}: RecentActivityTimelineProps): JSX.Element {
  return (
    <section className="dashboard-card dashboard-activity">
      <div className="dashboard-card__header">
        <div>
          <h2>Recent Activity</h2>
          <p>Recent changes derived from local LifeOS records.</p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="dashboard-activity__list">
          {items.map((item) => {
            const Icon = getActivityIcon(item.module);
            return (
              <button
                className="dashboard-activity__item"
                key={item.id}
                onClick={() => onNavigate(item.route)}
                type="button"
              >
                <span className="dashboard-activity__icon">
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{item.text}</strong>
                  <span>{item.module} • {formatActivityDate(item.date)}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <DashboardEmptyState
          title="No recent activity"
          description="Create tasks, complete habits, update goals, add transactions, or save reviews to build a timeline."
        />
      )}
    </section>
  );
}

function getActivityIcon(module: DashboardActivityItem["module"]) {
  switch (module) {
    case "Tasks":
      return CheckCircle2;
    case "Habits":
      return Repeat2;
    case "Goals":
      return Flag;
    case "Finance":
      return CircleDollarSign;
    case "Reviews":
      return ScrollText;
    default:
      return SquarePlus;
  }
}

function formatActivityDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}
