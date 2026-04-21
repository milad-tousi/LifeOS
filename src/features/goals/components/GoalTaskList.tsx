import { CalendarDays, CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
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
                task.status === "completed"
                  ? "goal-task-list__title goal-task-list__title--completed"
                  : "goal-task-list__title"
              }
            >
              {task.title}
            </strong>
            <div className="goal-task-list__meta">
              {task.scheduledDate ? (
                <span>
                  <CalendarDays size={14} />
                  {task.scheduledDate}
                </span>
              ) : null}
              <span>
                <Clock3 size={14} />
                {task.priority}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderTaskStatusIcon(status: Task["status"]): JSX.Element {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={20} />;
    case "cancelled":
      return <XCircle size={20} />;
    case "pending":
      return <Circle size={20} />;
  }
}
