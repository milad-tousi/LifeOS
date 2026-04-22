import { EmptyState } from "@/components/common/EmptyState";
import { Task } from "@/domains/tasks/types";
import { TaskGroupSection } from "@/features/tasks/components/TaskGroupSection";
import { TaskListGroup } from "@/features/tasks/utils/tasks-list-view.utils";

interface TasksListViewProps {
  goalTitlesById: Record<string, string>;
  groups: TaskListGroup[];
  hasTasks: boolean;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
}

export function TasksListView({
  goalTitlesById,
  groups,
  hasTasks,
  onDeleteTask,
  onEditTask,
  onToggleTask,
}: TasksListViewProps): JSX.Element {
  if (!hasTasks) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Add your first task to get started."
      />
    );
  }

  return (
    <div className="tasks-list-view">
      {groups.map((group) => (
        <TaskGroupSection
          goalTitlesById={goalTitlesById}
          key={group.key}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onToggleTask={onToggleTask}
          tasks={group.tasks}
          title={group.title}
        />
      ))}
    </div>
  );
}
