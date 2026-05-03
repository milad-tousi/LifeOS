import { Task } from "@/domains/tasks/types";
import { TaskListRow } from "@/features/tasks/components/TaskListRow";
import { TaskListGroupKey } from "@/features/tasks/utils/tasks-list-view.utils";
import { useI18n } from "@/i18n";

interface TaskGroupSectionProps {
  allTasks: Task[];
  goalTitlesById: Record<string, string>;
  groupKey: TaskListGroupKey;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  tasks: Task[];
  title: string;
}

export function TaskGroupSection({
  allTasks,
  goalTitlesById,
  groupKey,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
  title,
}: TaskGroupSectionProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="tasks-group-section">
      <div className="tasks-group-section__header">
        <h3 className="tasks-group-section__title">
          {getGroupTitle(groupKey, title, t)} <span className="tasks-group-section__count">({tasks.length})</span>
        </h3>
      </div>

      <div className="goal-task-list">
        {tasks.map((task) => (
          <TaskListRow
            allTasks={allTasks}
            goalTitle={task.goalId ? goalTitlesById[task.goalId] : undefined}
            goalTitlesById={goalTitlesById}
            isStandalone={!task.goalId}
            key={task.id}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onToggleComplete={onToggleTask}
            task={task}
          />
        ))}
      </div>
    </section>
  );
}

function getGroupTitle(
  groupKey: TaskListGroupKey,
  fallbackTitle: string,
  t: ReturnType<typeof useI18n>["t"],
): string {
  switch (groupKey) {
    case "overdue":
      return t("tasks.overdue");
    case "today":
      return t("common.today");
    case "upcoming":
      return t("tasks.upcoming");
    case "no_date":
      return t("tasks.noDate");
    case "completed":
      return t("tasks.completed");
    default:
      return fallbackTitle;
  }
}
