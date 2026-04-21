import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Goal } from "@/domains/goals/types";

interface GoalListProps {
  goals: Goal[];
}

export function GoalList({ goals }: GoalListProps): JSX.Element {
  if (goals.length === 0) {
    return (
      <EmptyState
        title="No goals yet"
        description="Goals can stay compact: title, progress, and optional target date are enough."
      />
    );
  }

  return (
    <Card title="Goals">
      <div className="stack">
        {goals.map((goal) => (
          <div key={goal.id} className="row">
            <strong>{goal.title}</strong>
            <span className="muted">{goal.progress}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

