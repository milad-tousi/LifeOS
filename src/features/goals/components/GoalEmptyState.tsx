import { EmptyState } from "@/components/common/EmptyState";
import { useI18n } from "@/i18n";

interface GoalEmptyStateProps {
  onCreate?: () => void;
}

export function GoalEmptyState({ onCreate }: GoalEmptyStateProps): JSX.Element {
  const { t } = useI18n();

  return (
    <EmptyState
      actionLabel={onCreate ? t("goals.empty.action") : undefined}
      description={t("goals.empty.description")}
      onAction={onCreate}
      title={t("goals.empty.title")}
    />
  );
}
