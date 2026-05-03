import { EmptyState } from "@/components/common/EmptyState";
import { Task } from "@/domains/tasks/types";
import { TaskGroupSection } from "@/features/tasks/components/TaskGroupSection";
import { TaskListGroup } from "@/features/tasks/utils/tasks-list-view.utils";
import { useI18n } from "@/i18n";

interface TasksListViewProps {
  allTasks: Task[];
  goalTitlesById: Record<string, string>;
  groups: TaskListGroup[];
  hasTasks: boolean;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
}

export function TasksListView({
  allTasks,
  goalTitlesById,
  groups,
  hasTasks,
  onDeleteTask,
  onEditTask,
  onToggleTask,
}: TasksListViewProps): JSX.Element {
  const { t } = useI18n();

  if (!hasTasks) {
    return (
      <EmptyState
        title={t("tasks.noTasksYet")}
        description={t("tasks.noTasksDescription")}
      />
    );
  }

  return (
    <div className="tasks-list-view">
      {groups.map((group) => (
        <TaskGroupSection
          goalTitlesById={goalTitlesById}
          allTasks={allTasks}
          key={group.key}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onToggleTask={onToggleTask}
          tasks={group.tasks}
          groupKey={group.key}
          title={group.title}
        />
      ))}
    </div>
  );
}
