import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useHabits } from "@/features/habits/hooks/useHabits";

export function HabitsPage(): JSX.Element {
  const { habits, loading } = useHabits();

  return (
    <>
      <ScreenHeader
        title="Habits"
        description="Compact recurring routines designed for efficient local storage."
      />
      <Card title="Habit list">
        {loading ? (
          <p className="text-muted">Loading habits...</p>
        ) : habits.length === 0 ? (
          <EmptyState
            title="No habits yet"
            description="Habit records will remain lightweight and work entirely offline."
          />
        ) : (
          <div className="page-list">
            {habits.map((habit) => (
              <div key={habit.id} className="page-list__item">
                <strong>{habit.name}</strong>
                <span className="text-muted">{habit.frequency}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
