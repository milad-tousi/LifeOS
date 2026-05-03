import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckCircle2, Circle, CircleDashed, GripVertical, ListChecks, Target, Trash2, XCircle } from "lucide-react";
import { Task } from "@/domains/tasks/types";
import { formatTaskDueDate } from "@/features/tasks/utils/tasks-list-view.utils";
import {
  getAllDescendantTasks,
  getParentTask,
  getRootTask,
  getTaskDepth,
} from "@/features/tasks/utils/taskHierarchy";

interface TaskCardProps {
  allTasks?: Task[];
  goalTitle?: string;
  goalTitlesById?: Record<string, string>;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  task: Task;
}

export function TaskCard({
  allTasks = [task],
  goalTitle,
  goalTitlesById = {},
  onDelete,
  onEdit,
  task,
}: TaskCardProps): JSX.Element {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
  } = useDraggable({
    id: task.id,
    data: {
      type: "task-card",
      taskId: task.id,
      boardColumnId: task.boardColumnId,
      status: task.status,
    },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  const formattedDueDate = formatTaskDueDate(task);
  const depth = getTaskDepth(task.id, allTasks);
  const parentTask = getParentTask(task, allTasks);
  const rootTask = getRootTask(task, allTasks);
  const descendants = getAllDescendantTasks(allTasks, task.id);
  const childProgress =
    descendants.length > 0
      ? {
          completed: descendants.filter((item) => item.status === "done").length,
          total: descendants.filter((item) => item.status !== "cancelled").length,
        }
      : task.subtaskProgress;
  const resolvedGoalTitle = goalTitle ?? (task.goalId ? goalTitlesById[task.goalId] : undefined);

  return (
    <article
      className={`task-board-card${isDragging ? " task-board-card--dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="task-board-card__header">
        <button
          aria-label={`Reorder ${task.title}`}
          className="task-board-card__drag-handle"
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
        <span className={`goal-task-list__priority-chip goal-task-list__priority-chip--${task.priority}`}>
          {getPriorityLabel(task.priority)}
        </span>
        <span className="tasks-list-row__scope-chip">{getHierarchyLabel(task, depth)}</span>
        <button
          aria-label={`Delete task ${task.title}`}
          className="task-board-card__delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(task);
          }}
          type="button"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <button className="task-board-card__body" onClick={() => onEdit(task)} type="button">
        <div className="task-board-card__title-row">
          <span className="task-board-card__status">{renderStatusIcon(task.status)}</span>
          <strong className={task.status === "done" ? "goal-task-list__title goal-task-list__title--completed" : "goal-task-list__title"}>
            <span className="goal-task-list__title-text">{task.title}</span>
          </strong>
        </div>

        {task.description ? <p className="task-board-card__description">{task.description}</p> : null}

        <div className="task-board-card__meta">
          {resolvedGoalTitle ? (
            <span className="tasks-list-row__scope-chip tasks-list-row__scope-chip--goal">
              <Target size={13} />
              Goal: {resolvedGoalTitle}
            </span>
          ) : null}
          {task.parentTaskId ? (
            parentTask ? (
              <span className="tasks-list-row__scope-chip">Parent: {parentTask.title}</span>
            ) : (
              <span className="tasks-list-row__scope-chip tasks-list-row__scope-chip--warning">
                Missing parent
              </span>
            )
          ) : null}
          {depth > 1 && rootTask.id !== task.id ? (
            <span className="tasks-list-row__scope-chip">Root: {rootTask.title}</span>
          ) : null}
          {formattedDueDate ? (
            <span className="goal-task-list__meta-chip">
              <CalendarDays size={13} />
              {formattedDueDate}
            </span>
          ) : null}
          {childProgress.total > 0 ? (
            <span className="goal-task-list__meta-chip goal-task-list__meta-chip--success">
              <ListChecks size={13} />
              {childProgress.completed}/{childProgress.total}
            </span>
          ) : null}
        </div>
      </button>
    </article>
  );
}

function getHierarchyLabel(task: Task, depth: number): string {
  if (!task.parentTaskId) {
    return "Task";
  }

  return depth <= 1 ? "Subtask" : "Nested subtask";
}

function renderStatusIcon(status: Task["status"]): JSX.Element {
  switch (status) {
    case "done":
      return <CheckCircle2 size={16} />;
    case "cancelled":
      return <XCircle size={16} />;
    case "in_progress":
      return <CircleDashed size={16} />;
    case "todo":
    default:
      return <Circle size={16} />;
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
