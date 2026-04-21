import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useGoals } from "@/features/goals/hooks/useGoals";

export function GoalsPage(): JSX.Element {
  const { goals, loading } = useGoals();

  return (
    <>
      <ScreenHeader
        title="Goals"
        description="Goal records stay compact while supporting status and deadline-driven UI."
      />
      <Card title="Goal list">
        {loading ? (
          <p className="text-muted">Loading goals...</p>
        ) : goals.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Goals will be persisted locally without any backend dependency."
          />
        ) : (
          <div className="page-list">
            {goals.map((goal) => (
              <div key={goal.id} className="page-list__item">
                <div>
                  <strong>{goal.title}</strong>
                  <div className="text-muted">
                    {goal.currentValue} / {goal.targetValue ?? "?"}
                  </div>
                </div>
                <span className="text-muted">{goal.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
