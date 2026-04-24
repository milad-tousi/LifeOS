import { Button } from "@/components/common/Button";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HabitCard } from "@/features/habits/components/HabitCard";
import { getTodayDateKey } from "@/features/habits/utils/habit.utils";

interface TodayHabitsProps {
  habits: Habit[];
  logs: HabitLog[];
  onCreateHabit: () => void;
  onUpdateLog: (habitId: string, value: number) => void;
}

export function TodayHabits({
  habits,
  logs,
  onCreateHabit,
  onUpdateLog,
}: TodayHabitsProps): JSX.Element {
  if (habits.length === 0) {
    return (
      <section className="habit-panel">
        <header className="habit-panel__header">
          <h2>Today's Habits</h2>
        </header>
        <div className="habit-empty">
          <div className="habit-empty__icon" aria-hidden="true">
            <span />
          </div>
          <h3>Start building your first habit</h3>
          <p>Small daily actions lead to big results.</p>
          <Button onClick={onCreateHabit}>Create your first habit</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="habit-panel">
      <header className="habit-panel__header">
        <h2>Today's Habits</h2>
      </header>
      <div className="today-habits-list">
        {habits.map((habit) => {
          const today = getTodayDateKey();
          const todayLog = logs.find((item) => item.habitId === habit.id && item.date === today);

          return (
            <HabitCard
              habit={habit}
              key={habit.id}
              logs={logs}
              onUpdateLog={onUpdateLog}
              todayLog={todayLog}
            />
          );
        })}
      </div>
    </section>
  );
}
