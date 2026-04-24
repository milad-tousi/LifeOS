import { Archive, Pencil } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Habit, HabitLog } from "@/domains/habits/types";
import { calculateHabitCompletion } from "@/features/habits/services/habits.storage";

interface HabitOverviewProps {
  habits: Habit[];
  logs: HabitLog[];
  onArchiveHabit: (id: string) => void;
}

function formatTarget(habit: Habit): string {
  if (habit.type === "binary") {
    return "1 done";
  }

  return `${habit.target}${habit.unit ? ` ${habit.unit}` : ""}`;
}

export function HabitOverview({
  habits,
  logs,
  onArchiveHabit,
}: HabitOverviewProps): JSX.Element {
  return (
    <section className="habit-panel">
      <header className="habit-panel__header">
        <h2>Habit Overview</h2>
      </header>

      {habits.length === 0 ? (
        <p className="habit-overview-empty">Active habits will appear here after you create them.</p>
      ) : (
        <div className="habit-overview-list">
          {habits.map((habit) => {
            const todayLog = logs.find((log) => log.habitId === habit.id);
            const isCompleted = calculateHabitCompletion(habit, todayLog);

            return (
              <article className="habit-overview-row" key={habit.id}>
                <div className="habit-overview-row__name">
                  <strong>{habit.title}</strong>
                  <span>{habit.description || "No description"}</span>
                </div>
                <span className="habit-overview-row__meta">{habit.type}</span>
                <span className="habit-overview-row__meta">{formatTarget(habit)}</span>
                <span className="habit-overview-row__meta">{habit.category || "General"}</span>
                <span
                  className={`habit-status-pill${isCompleted ? " habit-status-pill--done" : ""}`}
                >
                  {isCompleted ? "Done" : "Open"}
                </span>
                <div className="habit-overview-row__actions">
                  <Button variant="ghost" disabled aria-label={`Edit ${habit.title}`}>
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onArchiveHabit(habit.id)}
                    aria-label={`Archive ${habit.title}`}
                  >
                    <Archive size={15} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
