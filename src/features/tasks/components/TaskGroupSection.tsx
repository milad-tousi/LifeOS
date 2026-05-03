import { Task } from "@/domains/tasks/types";
import { TaskListRow } from "@/features/tasks/components/TaskListRow";

interface TaskGroupSectionProps {
  allTasks: Task[];
  goalTitlesById: Record<string, string>;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  tasks: Task[];
  title: string;
}

export function TaskGroupSection({
  allTasks,
  goalTitlesById,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
  title,
}: TaskGroupSectionProps): JSX.Element {
  return (
    <section className="tasks-group-section">
      <div className="tasks-group-section__header">
        <h3 className="tasks-group-section__title">
          {title} <span className="tasks-group-section__count">({tasks.length})</span>
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
