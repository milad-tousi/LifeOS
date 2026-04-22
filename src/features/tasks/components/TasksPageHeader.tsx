import { Button } from "@/components/common/Button";
import { ScreenHeader } from "@/components/common/ScreenHeader";

interface TasksPageHeaderProps {
  onAddTask: () => void;
}

export function TasksPageHeader({ onAddTask }: TasksPageHeaderProps): JSX.Element {
  return (
    <div className="tasks-page-header">
      <ScreenHeader
        title="Tasks"
        description="Manage your work, daily tasks, and goal-linked actions in one place."
      />
      <div className="tasks-page-header__actions">
        <Button onClick={onAddTask} type="button">
          Add task
        </Button>
      </div>
    </div>
  );
}
