import {
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  Link2,
  ListChecks,
  Trash2,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Task } from "@/domains/tasks/types";

interface GoalTaskListProps {
  tasks: Task[];
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  recentTaskId?: string | null;
  recentTaskTone?: "created" | "updated" | null;
  deletingTaskId?: string | null;
}

export function GoalTaskList({
  deletingTaskId = null,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  recentTaskId = null,
  recentTaskTone = null,
  tasks,
}: GoalTaskListProps): JSX.Element {
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
        <article
          className={[
            "goal-task-list__item",
            deletingTaskId === task.id ? "goal-task-list__item--deleting" : "",
            recentTaskId === task.id && recentTaskTone === "created"
              ? "goal-task-list__item--created"
              : "",
            recentTaskId === task.id && recentTaskTone === "updated"
              ? "goal-task-list__item--updated"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={task.id}
        >
          <button
            aria-label={`Toggle ${task.title}`}
            className="goal-task-list__toggle"
            onClick={(event) => {
              event.stopPropagation();
              onToggleTask(task);
            }}
            type="button"
          >
            {renderTaskStatusIcon(task.status)}
          </button>

          <button
            aria-label={`Edit ${task.title}`}
            className="goal-task-list__content-button"
            onClick={() => onEditTask(task)}
            type="button"
          >
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
              {task.description ? (
                <p className="goal-task-list__description">{task.description}</p>
              ) : null}
            </div>
          </button>

          <button
            aria-label={`Delete task ${task.title}`}
            className="goal-task-list__delete"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteTask(task);
            }}
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </article>
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
