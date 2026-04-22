import { EmptyState } from "@/components/common/EmptyState";

interface FinanceEmptyStateProps {
  description?: string;
  title?: string;
}

export function FinanceEmptyState({
  description = "Add your first income or expense to start building your finance history.",
  title = "No transactions yet",
}: FinanceEmptyStateProps): JSX.Element {
  return (
    <EmptyState
      title={title}
      description={description}
    />
  );
}
