import { CheckCircle2, CircleDollarSign, Flag, Repeat2, ScrollText, SquarePlus } from "lucide-react";
import { useI18n } from "@/i18n";
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
  const { t, language } = useI18n();

  return (
    <section className="dashboard-card dashboard-activity">
      <div className="dashboard-card__header">
        <div>
          <h2>{t("dashboard.recentActivity.title")}</h2>
          <p>{t("dashboard.recentActivity.subtitle")}</p>
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
                  <span>
                    {translateModule(item.module, t)} • {formatActivityDate(item.date, language)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <DashboardEmptyState
          title={t("dashboard.recentActivity.empty")}
          description={t("dashboard.recentActivity.emptyDescription")}
        />
      )}
    </section>
  );
}

type ActivityModule = DashboardActivityItem["module"];

function getActivityIcon(module: ActivityModule) {
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

function translateModule(
  module: ActivityModule,
  t: ReturnType<typeof useI18n>["t"],
): string {
  const keyMap: Record<ActivityModule, string> = {
    Tasks: "dashboard.recentActivity.module.tasks",
    Habits: "dashboard.recentActivity.module.habits",
    Goals: "dashboard.recentActivity.module.goals",
    Finance: "dashboard.recentActivity.module.finance",
    Reviews: "dashboard.recentActivity.module.reviews",
  };
  return t(keyMap[module] ?? "dashboard.recentActivity.module.tasks");
}

function formatActivityDate(value: string, language: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const locale = language === "fa" ? "fa-IR" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
