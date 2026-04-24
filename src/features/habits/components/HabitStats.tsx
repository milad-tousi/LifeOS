import { Award, CheckCircle2, ListChecks, TrendingUp } from "lucide-react";
import { TodayProgress } from "@/features/habits/services/habits.storage";

interface HabitStatsProps {
  progress: TodayProgress;
}

const statItems = [
  { key: "progress", label: "Today Progress", icon: TrendingUp },
  { key: "active", label: "Active Habits", icon: ListChecks },
  { key: "completed", label: "Completed Today", icon: CheckCircle2 },
  { key: "streak", label: "Current Best Streak", icon: Award },
] as const;

export function HabitStats({ progress }: HabitStatsProps): JSX.Element {
  const values = {
    progress: `${progress.completionPercent}%`,
    active: progress.activeHabits.toString(),
    completed: progress.completedToday.toString(),
    streak: `${progress.currentBestStreak}d`,
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
              <p className="habit-stat-card__label">{item.label}</p>
              <strong className="habit-stat-card__value">{values[item.key]}</strong>
              {item.key === "progress" ? (
                <span className="habit-stat-card__detail">
                  {progress.completedToday} of {progress.activeHabits} habits completed
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
