import { CheckCircle2, Circle, CircleDashed, Pencil, Plus, XCircle } from "lucide-react";
import { Task } from "@/domains/tasks/types";
import { TaskTreeNode } from "@/features/tasks/utils/taskHierarchy";
import { getGoalPriorityDisplayName } from "@/features/goals/utils/goals.i18n";
import { useI18n } from "@/i18n";
import { formatAppDate } from "@/i18n/formatters";

interface TaskTreeProps {
  compact?: boolean;
  depth?: number;
  nodes: TaskTreeNode[];
  onAddSubtask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
}

export function TaskTree({
  compact = false,
  depth = 0,
  nodes,
  onAddSubtask,
  onEditTask,
  onToggleComplete,
}: TaskTreeProps): JSX.Element {
  return (
    <div className={compact ? "task-tree task-tree--compact" : "task-tree"}>
      {nodes.map((node) => (
        <TaskTreeItem
          compact={compact}
          depth={depth}
          key={node.task.id}
          node={node}
          onAddSubtask={onAddSubtask}
          onEditTask={onEditTask}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  );
}

interface TaskTreeItemProps {
  compact: boolean;
  depth: number;
  node: TaskTreeNode;
  onAddSubtask?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
}

function TaskTreeItem({
  compact,
  depth,
  node,
  onAddSubtask,
  onEditTask,
  onToggleComplete,
}: TaskTreeItemProps): JSX.Element {
  const { language, t } = useI18n();
  const { task } = node;
  const scheduledLabel = task.dueDate ?? task.scheduledDate;

  return (
    <div className="task-tree__branch">
      <article
        className={[
          "task-tree__item",
          compact ? "task-tree__item--compact" : "",
          task.status === "done" ? "task-tree__item--done" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ marginInlineStart: `${depth * 22}px` }}
      >
        <button
          aria-label={t("goals.taskList.toggleTaskAria", { title: task.title })}
          className="task-tree__status"
          onClick={() => onToggleComplete?.(task)}
          type="button"
        >
          {renderStatusIcon(task)}
        </button>
        <div className="task-tree__content">
          <div className="task-tree__topline">
            <strong>{task.title}</strong>
            <span className="task-tree__badge">{getTaskBadge(depth, t)}</span>
          </div>
          <div className="task-tree__meta">
            <span>{getTaskStatusLabel(task.status, t)}</span>
            <span>{t("tasks.priorityLabel", { priority: getGoalPriorityDisplayName(task.priority, t) })}</span>
            {scheduledLabel ? <span>{formatTaskDate(scheduledLabel, language)}</span> : null}
          </div>
        </div>
        <div className="task-tree__actions">
          {onEditTask ? (
            <button
              aria-label={t("goals.taskList.editTaskAria", { title: task.title })}
              onClick={() => onEditTask(task)}
              type="button"
            >
              <Pencil size={15} />
            </button>
          ) : null}
          {onAddSubtask ? (
            <button
              aria-label={t("tasks.addSubtaskToTask", { title: task.title })}
              onClick={() => onAddSubtask(task)}
              type="button"
            >
              <Plus size={15} />
            </button>
          ) : null}
        </div>
      </article>
      {node.children.length > 0 ? (
        <TaskTree
          compact={compact}
          depth={depth + 1}
          nodes={node.children}
          onAddSubtask={onAddSubtask}
          onEditTask={onEditTask}
          onToggleComplete={onToggleComplete}
        />
      ) : null}
    </div>
  );
}

function renderStatusIcon(task: Task): JSX.Element {
  if (task.status === "done") {
    return <CheckCircle2 size={18} />;
  }

  if (task.status === "cancelled") {
    return <XCircle size={18} />;
  }

  if (task.status === "in_progress") {
    return <CircleDashed size={18} />;
  }

  return <Circle size={18} />;
}

function getTaskBadge(depth: number, t: (key: string) => string): string {
  if (depth === 0) {
    return t("tasks.task");
  }

  if (depth === 1) {
    return t("tasks.subtask");
  }

  return t("tasks.nestedSubtask");
}

function getTaskStatusLabel(status: Task["status"], t: (key: string) => string): string {
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

function formatTaskDate(value: string, language: "en" | "fa"): string {
  const safeDate = new Date(value);
  return Number.isNaN(safeDate.getTime()) ? value : formatAppDate(safeDate, language);
}
