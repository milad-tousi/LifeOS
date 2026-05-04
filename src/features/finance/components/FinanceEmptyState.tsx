import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/i18n";

interface FinanceEmptyStateProps {
  actionLabel?: string;
  description?: string;
  onAction?: () => void;
  title?: string;
}

export function FinanceEmptyState({
  actionLabel,
  description,
  onAction,
  title,
}: FinanceEmptyStateProps): JSX.Element {
  const { t } = useI18n();

  return (
    <EmptyState
      actionLabel={actionLabel}
      title={title ?? t("finance.noTransactionsYet")}
      description={description ?? t("finance.noTransactionsDescription")}
      onAction={onAction}
    />
  );
}
