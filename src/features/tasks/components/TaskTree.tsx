import { CheckCircle2, Circle, CircleDashed, Plus, Pencil } from "lucide-react";
import { Task } from "@/domains/tasks/types";
import { TaskTreeNode } from "@/features/tasks/utils/taskHierarchy";

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
  const { task } = node;

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
        style={{ marginLeft: `${depth * 22}px` }}
      >
        <button
          aria-label={`Toggle ${task.title}`}
          className="task-tree__status"
          onClick={() => onToggleComplete?.(task)}
          type="button"
        >
          {renderStatusIcon(task)}
        </button>
        <div className="task-tree__content">
          <div className="task-tree__topline">
            <strong>{task.title}</strong>
            <span className="task-tree__badge">{getTaskBadge(depth)}</span>
          </div>
          <div className="task-tree__meta">
            <span>{task.status}</span>
            <span>{task.priority} priority</span>
            {task.dueDate ?? task.scheduledDate ? <span>{task.dueDate ?? task.scheduledDate}</span> : null}
          </div>
        </div>
        <div className="task-tree__actions">
          {onEditTask ? (
            <button aria-label={`Edit ${task.title}`} onClick={() => onEditTask(task)} type="button">
              <Pencil size={15} />
            </button>
          ) : null}
          {onAddSubtask ? (
            <button aria-label={`Add subtask to ${task.title}`} onClick={() => onAddSubtask(task)} type="button">
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

  if (task.status === "in_progress") {
    return <CircleDashed size={18} />;
  }

  return <Circle size={18} />;
}

function getTaskBadge(depth: number): string {
  if (depth === 0) {
    return "Task";
  }

  if (depth === 1) {
    return "Subtask";
  }

  return "Nested Subtask";
}
