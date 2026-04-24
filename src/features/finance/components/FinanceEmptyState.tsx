import { EmptyState } from "@/components/common/EmptyState";

interface FinanceEmptyStateProps {
  actionLabel?: string;
  description?: string;
  onAction?: () => void;
  title?: string;
}

export function FinanceEmptyState({
  actionLabel,
  description = "Add your first income or expense to start building your finance history.",
  onAction,
  title = "No transactions yet",
}: FinanceEmptyStateProps): JSX.Element {
  return (
    <EmptyState
      actionLabel={actionLabel}
      title={title}
      description={description}
      onAction={onAction}
    />
  );
}
