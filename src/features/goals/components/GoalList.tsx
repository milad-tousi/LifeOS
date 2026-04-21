import { GoalCard } from "@/features/goals/components/GoalCard";
import { GoalCardData } from "@/features/goals/hooks/useGoals";

interface GoalListProps {
  goals: GoalCardData[];
  onOpenGoal: (goalId: string) => void;
}

export function GoalList({ goals, onOpenGoal }: GoalListProps): JSX.Element {
  return (
    <div className="goals-page__desktop-grid">
      {goals.map((goalData) => (
        <GoalCard
          data={goalData}
          key={goalData.goal.id}
          onClick={() => onOpenGoal(goalData.goal.id)}
        />
      ))}
    </div>
  );
}
