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
  Pencil,
  PlayCircle,
  Tag,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Task } from "@/domains/tasks/types";
import { summarizeTaskSources } from "@/domains/tasks/task.utils";
import { TaskResourceBadge } from "@/features/tasks/components/TaskResourceBadge";
import { TaskResourceModal, TaskResourceModalType } from "@/features/tasks/components/TaskResourceModal";
import { formatTaskDueDate } from "@/features/tasks/utils/tasks-list-view.utils";
import {
  getAllDescendantTasks,
  getParentTask,
  getRootTask,
  getTaskDepth,
  isSubtask,
} from "@/features/tasks/utils/taskHierarchy";
import { useI18n } from "@/i18n";

interface TaskListRowProps {
  allTasks?: Task[];
  goalTitle?: string;
  goalTitlesById?: Record<string, string>;
  isStandalone?: boolean;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  task: Task;
}

export function TaskListRow({
  allTasks = [task],
  goalTitle,
  goalTitlesById = {},
  isStandalone = false,
  onDelete,
  onEdit,
  onToggleComplete,
  task,
}: TaskListRowProps): JSX.Element {
  const { t } = useI18n();
  const [activeResourceModal, setActiveResourceModal] = useState<TaskResourceModalType | null>(null);
  const formattedDueDate = formatTaskDueDate(task);
  const descendants = getAllDescendantTasks(allTasks, task.id);
  const directChildren = allTasks.filter((item) => item.parentTaskId === task.id);
  const depth = getTaskDepth(task.id, allTasks);
  const parentTask = getParentTask(task, allTasks);
  const rootTask = getRootTask(task, allTasks);
  const resolvedGoalTitle = goalTitle ?? (task.goalId ? goalTitlesById[task.goalId] : undefined);
  const childProgress =
    descendants.length > 0
      ? {
          completed: descendants.filter((item) => item.status === "done").length,
          total: descendants.filter((item) => item.status !== "cancelled").length,
        }
      : task.subtaskProgress;
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
    <article className="goal-task-list__item">
      <button
        aria-label={`${t("goals.taskList.toggleTaskAria", { title: task.title })}`}
        className={`goal-task-list__toggle${
          task.status === "done" ? " goal-task-list__toggle--done" : ""
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleComplete(task);
        }}
        type="button"
      >
        <span className="goal-task-list__toggle-icon">{renderTaskStatusIcon(task.status)}</span>
      </button>

      <div className="goal-task-list__content-button">
        <div className="goal-task-list__content">
          <div className="goal-task-list__topline">
            <strong
              className={
                task.status === "done"
                  ? "goal-task-list__title goal-task-list__title--completed"
                  : "goal-task-list__title"
              }
            >
              <span className="goal-task-list__title-text">{task.title}</span>
            </strong>
            <div className="goal-task-list__badges">
              <span className="tasks-list-row__scope-chip">{getHierarchyLabel(task, depth, t)}</span>
              <span
                className={`goal-task-list__status-chip goal-task-list__status-chip--${task.status}`}
              >
                <span className="goal-task-list__status-dot" aria-hidden="true" />
                {getStatusLabel(task.status, t)}
              </span>
              <span
                className={`goal-task-list__priority-chip goal-task-list__priority-chip--${task.priority}`}
              >
                {getPriorityLabel(task.priority, t)}
              </span>
            </div>
          </div>

          {task.description ? <p className="goal-task-list__description">{task.description}</p> : null}

          <div className="goal-task-list__meta">
            {resolvedGoalTitle ? (
              <span className="tasks-list-row__scope-chip tasks-list-row__scope-chip--goal">
                <Target size={14} />
                {t("navigation.goals")}: {resolvedGoalTitle}
              </span>
            ) : isStandalone ? (
              <span className="tasks-list-row__scope-chip">
                <Circle size={12} />
                {t("tasks.modal.standalone")}
              </span>
            ) : null}
            {isSubtask(task) ? (
              parentTask ? (
                <span className="tasks-list-row__scope-chip">
                  {t("tasks.parentTask")}: {parentTask.title}
                </span>
              ) : (
                <span className="tasks-list-row__scope-chip tasks-list-row__scope-chip--warning">
                  {t("tasks.resources.missingParent")}
                </span>
              )
            ) : null}
            {depth > 1 && rootTask.id !== task.id ? (
              <span className="tasks-list-row__scope-chip">
                {t("tasks.rootTask")}: {rootTask.title}
              </span>
            ) : null}
            {formattedDueDate ? (
              <span className="goal-task-list__meta-chip">
                <CalendarDays size={14} />
                {formattedDueDate}
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
            {resourceSummaries.map((source) => (
              <TaskResourceBadge
              ariaLabel={getResourceBadgeAriaLabel(source.type, t)}
              key={source.type}
              onClick={() => setActiveResourceModal(source.type as TaskResourceModalType)}
            >
                {renderSourceSummaryIcon(source.type)}
                {formatResourceBadgeLabel(source.type, source.count, t)}
              </TaskResourceBadge>
            ))}
            {childProgress.total > 0 ? (
              <span className="goal-task-list__meta-chip goal-task-list__meta-chip--success">
                <ListChecks size={14} />
                {childProgress.completed} / {childProgress.total} {t("tasks.modal.subtasks").toLowerCase()}
              </span>
            ) : null}
            {directChildren.length > 0 ? (
              <span className="goal-task-list__meta-chip">
                {directChildren.length} {t("tasks.subtask")}
              </span>
            ) : null}
          </div>

          {childProgress.total > 0 ? (
            <div className="goal-task-list__subtasks">
              <div className="goal-task-list__subtasks-header">
                <span className="goal-task-list__subtasks-label">
                  {childProgress.completed} / {childProgress.total} subtasks
                </span>
                <span className="goal-task-list__subtasks-value">
                  {Math.round((childProgress.completed / childProgress.total) * 100)}%
                </span>
              </div>
              <div
                aria-hidden="true"
                className={`goal-task-list__subtasks-bar${
                  childProgress.completed === childProgress.total
                    ? " goal-task-list__subtasks-bar--complete"
                    : ""
                }`}
              >
                <span
                  className="goal-task-list__subtasks-bar-fill"
                  style={{
                    width: `${Math.round(
                      (childProgress.completed / childProgress.total) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <button
        aria-label={t("tasks.resources.editTask")}
        className="goal-task-list__delete"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(task);
        }}
        type="button"
      >
        <Pencil size={16} />
      </button>

      <button
        aria-label={t("tasks.resources.deleteTask")}
        className="goal-task-list__delete"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(task);
        }}
        type="button"
      >
        <Trash2 size={16} />
      </button>
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

function renderTaskStatusIcon(status: Task["status"]): JSX.Element {
  switch (status) {
    case "done":
      return <CheckCircle2 size={20} />;
    case "cancelled":
      return <XCircle size={20} />;
    case "in_progress":
      return <CircleDashed size={20} />;
    case "todo":
    default:
      return <Circle size={20} />;
  }
}

function getStatusLabel(status: Task["status"], t: (key: string) => string): string {
  switch (status) {
    case "done":
      return t("tasks.done");
    case "cancelled":
      return t("tasks.cancelled");
    case "in_progress":
      return t("tasks.inProgress");
    case "todo":
    default:
      return t("tasks.todo");
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

function getResourceBadgeAriaLabel(
  type: "video" | "link" | "note",
  t: (key: string) => string,
): string {
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
