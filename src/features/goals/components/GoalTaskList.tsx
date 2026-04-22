import { CalendarDays, CheckCircle2, Circle, CircleDashed, Clock3, Link2, ListChecks, XCircle } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

interface GoalTaskListProps {
  tasks: Task[];
}

export function GoalTaskList({ tasks }: GoalTaskListProps): JSX.Element {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No steps yet"
        description="No steps yet. Add tasks to start making progress."
      />
    );
  }

  return (
    <div className="goal-task-list">
      {tasks.map((task) => (
        <div className="goal-task-list__item" key={task.id}>
          <button
            aria-label={`Toggle ${task.title}`}
            className="goal-task-list__toggle"
            onClick={() => void tasksRepository.toggleTaskComplete(task.id)}
            type="button"
          >
            {renderTaskStatusIcon(task.status)}
          </button>

          <div className="goal-task-list__content">
            <strong
              className={
                task.status === "done"
                  ? "goal-task-list__title goal-task-list__title--completed"
                  : "goal-task-list__title"
              }
            >
              {task.title}
            </strong>
            <div className="goal-task-list__meta">
              {task.dueDate ?? task.scheduledDate ? (
                <span>
                  <CalendarDays size={14} />
                  {task.dueDate ?? task.scheduledDate}
                </span>
              ) : null}
              <span>
                <Clock3 size={14} />
                {task.priority}
              </span>
              {task.sources.length > 0 ? (
                <span>
                  <Link2 size={14} />
                  {task.sources.length} source{task.sources.length === 1 ? "" : "s"}
                </span>
              ) : null}
              {task.subtaskProgress.total > 0 ? (
                <span>
                  <ListChecks size={14} />
                  {task.subtaskProgress.completed}/{task.subtaskProgress.total} subtasks
                </span>
              ) : null}
            </div>
            {task.description ? <p className="goal-task-list__description">{task.description}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTaskStatusIcon(status: Task["status"]): JSX.Element {
  switch (status) {
    case "done":
      return <CheckCircle2 size={20} />;
    case "cancelled":
      return <XCircle size={20} />;
    case "in_progress":
      return <CircleDashed size={20} />;
    case "todo":
      return <Circle size={20} />;
  }
}
