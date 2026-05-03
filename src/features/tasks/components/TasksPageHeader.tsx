import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { useI18n } from "@/i18n";

interface TasksPageHeaderProps {
  onAddTask: () => void;
}

export function TasksPageHeader({ onAddTask }: TasksPageHeaderProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="tasks-page-header">
      <ScreenHeader
        title={t("tasks.title")}
        description={t("tasks.subtitle")}
      />
      <div className="tasks-page-header__actions">
        <Button onClick={onAddTask} type="button">
          {t("tasks.addTask")}
        </Button>
      </div>
    </div>
  );
}
