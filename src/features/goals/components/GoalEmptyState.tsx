import { EmptyState } from "@/components/common/EmptyState";

interface GoalEmptyStateProps {
  onCreate?: () => void;
}

export function GoalEmptyState({ onCreate }: GoalEmptyStateProps): JSX.Element {
  return (
    <EmptyState
      actionLabel={onCreate ? "Create your first goal" : undefined}
      description="Start with one meaningful goal. LifeOS will help you build it step by step."
      onAction={onCreate}
      title="No goals yet"
    />
  );
}
