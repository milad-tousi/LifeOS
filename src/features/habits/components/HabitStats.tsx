import { Award, CheckCircle2, ListChecks, TrendingUp } from "lucide-react";
import { TodayProgress } from "@/features/habits/services/habits.storage";
import { useI18n } from "@/i18n";

interface HabitStatsProps {
  progress: TodayProgress;
}

const statItems = [
  { key: "progress", labelKey: "habits.todayProgress", icon: TrendingUp },
  { key: "active", labelKey: "habits.activeHabits", icon: ListChecks },
  { key: "completed", labelKey: "habits.completedToday", icon: CheckCircle2 },
  { key: "streak", labelKey: "habits.currentBestStreak", icon: Award },
] as const;

export function HabitStats({ progress }: HabitStatsProps): JSX.Element {
  const { language, t } = useI18n();
  const numberFormatter = new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US");
  const values = {
    progress: `${numberFormatter.format(progress.completionPercent)}%`,
    active: numberFormatter.format(progress.activeHabits),
    completed: numberFormatter.format(progress.completedToday),
    streak: `${numberFormatter.format(progress.currentBestStreak)}d`,
  };

  return (
    <section className="habit-stats" aria-label="Habit statistics">
      {statItems.map((item) => {
        const Icon = item.icon;

        return (
          <article className="habit-stat-card" key={item.key}>
            <div className="habit-stat-card__icon" aria-hidden="true">
              <Icon size={18} />
            </div>
            <div>
              <p className="habit-stat-card__label">{t(item.labelKey)}</p>
              <strong className="habit-stat-card__value">{values[item.key]}</strong>
              {item.key === "progress" ? (
                <span className="habit-stat-card__detail">
                  {numberFormatter.format(progress.completedToday)} {t("habits.ofHabitsCompleted").replace("{total}", numberFormatter.format(progress.activeHabits))}
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
