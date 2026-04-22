import {
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  FileImage,
  FileText,
  Link2,
  ListChecks,
  NotebookText,
  PlayCircle,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Task } from "@/domains/tasks/types";
import { summarizeTaskSources } from "@/domains/tasks/task.utils";

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
              <div className="goal-task-list__topline">
                <strong
                  className={
                    task.status === "done"
                      ? "goal-task-list__title goal-task-list__title--completed"
                      : "goal-task-list__title"
                  }
                >
                  {task.title}
                </strong>
                <div className="goal-task-list__badges">
                  <span
                    className={`goal-task-list__status-chip goal-task-list__status-chip--${task.status}`}
                  >
                    <span className="goal-task-list__status-dot" aria-hidden="true" />
                    {getStatusLabel(task.status)}
                  </span>
                  <span
                    className={`goal-task-list__priority-chip goal-task-list__priority-chip--${task.priority}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
              </div>
              <div className="goal-task-list__meta">
                {task.dueDate ?? task.scheduledDate ? (
                  <span className="goal-task-list__meta-chip">
                    <CalendarDays size={14} />
                    {task.dueDate ?? task.scheduledDate}
                  </span>
                ) : null}
                {task.estimatedDurationMinutes ? (
                  <span className="goal-task-list__meta-chip">
                    <Clock3 size={14} />
                    {formatEstimatedDuration(task.estimatedDurationMinutes)}
                  </span>
                ) : null}
                {task.tags.map((tag) => (
                  <span className="goal-task-list__tag-chip" key={tag}>
                    <Tag size={13} />
                    {tag}
                  </span>
                ))}
                {summarizeTaskSources(task.sources).map((source) => (
                  <span className="goal-task-list__meta-chip" key={source.type}>
                    {renderSourceSummaryIcon(source.type)}
                    {source.label}
                  </span>
                ))}
                {task.subtaskProgress.total > 0 ? (
                  <span className="goal-task-list__meta-chip goal-task-list__meta-chip--success">
                    <ListChecks size={14} />
                    {task.subtaskProgress.completed} / {task.subtaskProgress.total} subtasks
                  </span>
                ) : null}
              </div>
              {task.subtaskProgress.total > 0 ? (
                <div className="goal-task-list__subtasks">
                  <div className="goal-task-list__subtasks-header">
                    <span className="goal-task-list__subtasks-label">
                      {task.subtaskProgress.completed} / {task.subtaskProgress.total} subtasks
                    </span>
                    <span className="goal-task-list__subtasks-value">
                      {Math.round(
                        (task.subtaskProgress.completed / task.subtaskProgress.total) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className={`goal-task-list__subtasks-bar${
                      task.subtaskProgress.completed === task.subtaskProgress.total
                        ? " goal-task-list__subtasks-bar--complete"
                        : ""
                    }`}
                  >
                    <span
                      className="goal-task-list__subtasks-bar-fill"
                      style={{
                        width: `${Math.round(
                          (task.subtaskProgress.completed / task.subtaskProgress.total) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
              {task.status === "done" &&
              task.subtaskProgress.total > task.subtaskProgress.completed ? (
                <p className="goal-task-list__warning">
                  {task.subtaskProgress.total - task.subtaskProgress.completed} of{" "}
                  {task.subtaskProgress.total} subtasks still incomplete
                </p>
              ) : null}
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

function getStatusLabel(status: Task["status"]): string {
  switch (status) {
    case "done":
      return "Done";
    case "cancelled":
      return "Cancelled";
    case "in_progress":
      return "In progress";
    case "todo":
    default:
      return "To do";
  }
}

function getPriorityLabel(priority: Task["priority"]): string {
  switch (priority) {
    case "high":
      return "High";
    case "low":
      return "Low";
    case "medium":
    default:
      return "Medium";
  }
}

function formatEstimatedDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function renderSourceSummaryIcon(type: "image" | "video" | "link" | "file" | "note"): JSX.Element {
  switch (type) {
    case "image":
      return <FileImage size={14} />;
    case "video":
      return <PlayCircle size={14} />;
    case "file":
      return <FileText size={14} />;
    case "note":
      return <NotebookText size={14} />;
    case "link":
    default:
      return <Link2 size={14} />;
  }
}
