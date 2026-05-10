import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, CheckCircle2, Circle, CircleDashed, GripVertical, Link2, ListChecks, NotebookText, Pencil, PlayCircle, Target, Trash2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { summarizeTaskSources } from "@/domains/tasks/task.utils";
import { Task } from "@/domains/tasks/types";
import { TaskResourceBadge } from "@/features/tasks/components/TaskResourceBadge";
import { TaskResourceModal, TaskResourceModalType } from "@/features/tasks/components/TaskResourceModal";
import { formatTaskDueDate } from "@/features/tasks/utils/tasks-list-view.utils";
import {
  getAllDescendantTasks,
  getParentTask,
  getRootTask,
  getTaskDepth,
} from "@/features/tasks/utils/taskHierarchy";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
  const [activeResourceModal, setActiveResourceModal] = useState<TaskResourceModalType | null>(null);
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
  const resourceSummaries = useMemo(() => {
    const summaries = summarizeTaskSources(task.sources).filter(
      (source) => source.type !== "image" && source.type !== "file",
    );
    const noteSummary = summaries.find((source) => source.type === "note");

    if (task.description?.trim()) {
      if (noteSummary) {
        noteSummary.count += 1;
      } else {
        summaries.push({
          count: 1,
          label: "",
          type: "note",
        });
      }
    }

    return summaries;
  }, [task.description, task.sources]);

  return (
    <>
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
            {getPriorityLabel(task.priority, t)}
          </span>
          <span className="tasks-list-row__scope-chip">{getHierarchyLabel(task, depth, t)}</span>
          <div className="task-board-card__actions">
            <button
              aria-label={t("tasks.resources.editTask")}
              className="task-board-card__icon-button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(task);
              }}
              type="button"
            >
              <Pencil size={15} />
            </button>
            <button
              aria-label={t("tasks.resources.deleteTask")}
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
        </div>

        <div className="task-board-card__body">
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
              {t("navigation.goals")}: {resolvedGoalTitle}
            </span>
          ) : null}
          {task.parentTaskId ? (
            parentTask ? (
              <span className="tasks-list-row__scope-chip">{t("tasks.parentTask")}: {parentTask.title}</span>
            ) : (
              <span className="tasks-list-row__scope-chip tasks-list-row__scope-chip--warning">
                {t("tasks.resources.missingParent")}
              </span>
            )
          ) : null}
          {depth > 1 && rootTask.id !== task.id ? (
            <span className="tasks-list-row__scope-chip">{t("tasks.rootTask")}: {rootTask.title}</span>
          ) : null}
          {formattedDueDate ? (
            <span className="goal-task-list__meta-chip">
              <CalendarDays size={13} />
              {formattedDueDate}
            </span>
          ) : null}
          {resourceSummaries.map((source) => (
            <TaskResourceBadge
              ariaLabel={getResourceBadgeAriaLabel(source.type, t)}
              key={source.type}
              onClick={() => setActiveResourceModal(source.type as TaskResourceModalType)}
            >
              {renderResourceSummaryIcon(source.type)}
              {formatResourceBadgeLabel(source.type, source.count, t)}
            </TaskResourceBadge>
          ))}
          {childProgress.total > 0 ? (
            <span className="goal-task-list__meta-chip goal-task-list__meta-chip--success">
              <ListChecks size={13} />
              {childProgress.completed}/{childProgress.total}
            </span>
          ) : null}
        </div>
        </div>
      </article>

      <TaskResourceModal
        isOpen={Boolean(activeResourceModal)}
        onClose={() => setActiveResourceModal(null)}
        onEditTask={onEdit}
        task={task}
        type={activeResourceModal ?? "link"}
      />
    </>
  );
}

function getHierarchyLabel(task: Task, depth: number, t: (key: string) => string): string {
  if (!task.parentTaskId) {
    return t("tasks.task");
  }

  return depth <= 1 ? t("tasks.subtask") : t("tasks.nestedSubtask");
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

function getPriorityLabel(priority: Task["priority"], t: (key: string) => string): string {
  switch (priority) {
    case "high":
      return t("goals.priorities.high");
    case "low":
      return t("goals.priorities.low");
    case "medium":
    default:
      return t("goals.priorities.medium");
  }
}

function renderResourceSummaryIcon(type: "video" | "link" | "note"): JSX.Element {
  switch (type) {
    case "video":
      return <PlayCircle size={13} />;
    case "note":
      return <NotebookText size={13} />;
    case "link":
    default:
      return <Link2 size={13} />;
  }
}

function getResourceBadgeAriaLabel(type: "video" | "link" | "note", t: (key: string) => string): string {
  switch (type) {
    case "video":
      return t("tasks.resources.openVideosAria");
    case "note":
      return t("tasks.resources.openNotesAria");
    case "link":
    default:
      return t("tasks.resources.openLinksAria");
  }
}

function formatResourceBadgeLabel(
  type: "video" | "link" | "note",
  count: number,
  t: (key: string) => string,
): string {
  const label =
    type === "video"
      ? t("tasks.resources.video")
      : type === "note"
        ? t("tasks.resources.note")
        : t("tasks.resources.link");

  return `${count} ${label}`;
}
