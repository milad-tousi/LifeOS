import { Button } from "@/components/common/Button";
import { Goal } from "@/domains/goals/types";
import { Habit, HabitLog } from "@/domains/habits/types";
import { HabitCard } from "@/features/habits/components/HabitCard";
import { HabitCategory } from "@/features/habits/services/habit-categories.storage";
import {
  getHabitCurrentPeriodKey,
  getHabitLogPeriodKey,
} from "@/features/habits/utils/habit.utils";

interface TodayHabitsProps {
  categories: HabitCategory[];
  goals: Goal[];
  hasAnyHabits: boolean;
  habits: Habit[];
  logs: HabitLog[];
  onArchiveHabit: (habitId: string) => void;
  onCreateHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onOpenHabit: (habit: Habit) => void;
  onUpdateLog: (habitId: string, value: number) => void;
}

function HabitEmptyCallout({
  hasAnyHabits,
  onCreateHabit,
}: {
  hasAnyHabits: boolean;
  onCreateHabit: () => void;
}): JSX.Element {
  return (
    <div className="habit-empty">
      <div className="habit-empty__icon" aria-hidden="true">
        <span />
      </div>
      <h3>{hasAnyHabits ? "No habits scheduled for today" : "Start building your habits"}</h3>
      <p>
        {hasAnyHabits
          ? "Your routines will appear here on their active days."
          : "Small daily actions lead to big results."}
      </p>
      {!hasAnyHabits ? (
        <Button className="habit-empty__button" onClick={onCreateHabit}>
          Create your first habit
        </Button>
      ) : null}
    </div>
  );
}

export function TodayHabits({
  categories,
  goals,
  hasAnyHabits,
  habits,
  logs,
  onArchiveHabit,
  onCreateHabit,
  onEditHabit,
  onOpenHabit,
  onUpdateLog,
}: TodayHabitsProps): JSX.Element {
  if (habits.length === 0) {
    return (
      <section className="habit-panel">
        <header className="habit-panel__header">
          <h2>Today's Habits</h2>
        </header>
        <HabitEmptyCallout hasAnyHabits={hasAnyHabits} onCreateHabit={onCreateHabit} />
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
          const periodKey = getHabitCurrentPeriodKey(habit, new Date());
          const todayLog = periodKey
            ? logs.find(
                (item) => item.habitId === habit.id && getHabitLogPeriodKey(item) === periodKey,
              )
            : undefined;

          return (
            <HabitCard
              categories={categories}
              goals={goals}
              habit={habit}
              key={habit.id}
              logs={logs}
              onArchiveHabit={onArchiveHabit}
              onEditHabit={onEditHabit}
              onOpenHabit={onOpenHabit}
              onUpdateLog={onUpdateLog}
              todayLog={todayLog}
            />
          );
        })}
      </div>
    </section>
  );
}
