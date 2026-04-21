import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { useTasks } from "@/features/tasks/hooks/useTasks";

export function DashboardPage(): JSX.Element {
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const hasData = tasks.length > 0 || habits.length > 0 || goals.length > 0;

  return (
    <>
      <ScreenHeader
        title="Dashboard"
        description="A compact local overview powered entirely by on-device data."
      />
      {hasData ? (
        <Card title="Overview" subtitle="Counts are read directly from IndexedDB">
          <div className="page-list">
            <div className="page-list__item">
              <span>Tasks</span>
              <strong>{tasks.length}</strong>
            </div>
            <div className="page-list__item">
              <span>Habits</span>
              <strong>{habits.length}</strong>
            </div>
            <div className="page-list__item">
              <span>Goals</span>
              <strong>{goals.length}</strong>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No local data yet"
          description="Add tasks, habits, or goals to populate your offline dashboard."
        />
      )}
    </>
  );
}
