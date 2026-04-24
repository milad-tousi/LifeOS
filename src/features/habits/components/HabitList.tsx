import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Habit } from "@/domains/habits/types";

interface HabitListProps {
  habits: Habit[];
}

export function HabitList({ habits }: HabitListProps): JSX.Element {
  if (habits.length === 0) {
    return (
      <EmptyState
        title="No habits yet"
        description="Habit records are ready to be stored locally."
      />
    );
  }

  return (
    <Card title="Habits">
      <div className="page-list">
        {habits.map((habit) => (
          <div key={habit.id} className="page-list__item">
            <strong>{habit.title}</strong>
            <span className="text-muted">{habit.frequency}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
