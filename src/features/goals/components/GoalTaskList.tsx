import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  Clock3,
  FileImage,
  FileText,
  GripVertical,
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
import { TaskTree } from "@/features/tasks/components/TaskTree";
import {
  buildGoalTaskTree,
  getAllDescendantTasks,
  TaskTreeNode,
} from "@/features/tasks/utils/taskHierarchy";
import { getGoalPriorityDisplayName } from "@/features/goals/utils/goals.i18n";
import { useI18n } from "@/i18n";
import { formatAppDate, formatNumber } from "@/i18n/formatters";

interface GoalTaskListProps {
  goalId: string;
  onMarkHighPriority: (task: Task) => void;
  onMarkInProgress: (task: Task) => void;
  onReorderTasks: (tasks: Task[]) => void;
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
  goalId,
  onMarkHighPriority,
  onMarkInProgress,
  onReorderTasks,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  recentTaskId = null,
  recentTaskTone = null,
  tasks,
}: GoalTaskListProps): JSX.Element {
  const { t } = useI18n();
  const taskTrees = buildGoalTaskTree(tasks, goalId);
  const rootTasks = taskTrees.map((node) => node.task);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 160,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (rootTasks.length === 0) {
    return (
      <EmptyState
        title={t("goals.noStepsYet")}
        description={t("goals.detail.stepsEmptyDescription")}
      />
    );
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = rootTasks.findIndex((task) => task.id === active.id);
    const newIndex = rootTasks.findIndex((task) => task.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedTasks = [...rootTasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    onReorderTasks([
      ...reorderedTasks.map((task, index) => ({
        ...task,
        sortOrder: index,
      })),
      ...tasks.filter((task) => task.parentTaskId),
    ]);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={rootTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="goal-task-list">
          {taskTrees.map((treeNode) => (
            <SortableTaskItem
              allTasks={tasks}
              deletingTaskId={deletingTaskId}
              key={treeNode.task.id}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onMarkHighPriority={onMarkHighPriority}
              onMarkInProgress={onMarkInProgress}
              onToggleTask={onToggleTask}
              recentTaskId={recentTaskId}
              recentTaskTone={recentTaskTone}
              task={treeNode.task}
              taskTreeChildren={treeNode.children}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableTaskItemProps {
  deletingTaskId: string | null;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onMarkHighPriority: (task: Task) => void;
  onMarkInProgress: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  recentTaskId: string | null;
  recentTaskTone: "created" | "updated" | null;
  task: Task;
  taskTreeChildren: TaskTreeNode["children"];
  allTasks: Task[];
}

function SortableTaskItem({
  deletingTaskId,
  onDeleteTask,
  onEditTask,
  onMarkHighPriority,
  onMarkInProgress,
  onToggleTask,
  recentTaskId,
  recentTaskTone,
  task,
  taskTreeChildren,
  allTasks,
}: SortableTaskItemProps): JSX.Element {
  const { language, t } = useI18n();
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const descendantTasks = getAllDescendantTasks(allTasks, task.id);
  const subtaskProgress = getDescendantProgress(task, descendantTasks);
  const subtaskPercent =
    subtaskProgress.total > 0
      ? Math.round((subtaskProgress.completed / subtaskProgress.total) * 100)
      : 0;

  return (
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
        isDragging ? "goal-task-list__item--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label={t("goals.taskList.reorderTaskAria", { title: task.title })}
        className="goal-task-list__drag-handle"
        onClick={(event) => event.preventDefault()}
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <button
        aria-label={t("goals.taskList.toggleTaskAria", { title: task.title })}
        className={`goal-task-list__toggle${
          task.status === "done" ? " goal-task-list__toggle--done" : ""
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleTask(task);
        }}
        type="button"
      >
        <span className="goal-task-list__toggle-icon">{renderTaskStatusIcon(task.status)}</span>
      </button>

      <button
        aria-label={t("goals.taskList.editTaskAria", { title: task.title })}
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
              <span className="goal-task-list__title-text">{task.title}</span>
            </strong>
            <div className="goal-task-list__badges">
              <span
                className={`goal-task-list__status-chip goal-task-list__status-chip--${task.status}`}
              >
                <span className="goal-task-list__status-dot" aria-hidden="true" />
                {getTaskStatusLabel(task.status, t)}
              </span>
              <span
                className={`goal-task-list__priority-chip goal-task-list__priority-chip--${task.priority}`}
              >
                {getGoalPriorityDisplayName(task.priority, t)}
              </span>
            </div>
          </div>
          <div className="goal-task-list__meta">
            {task.dueDate ?? task.scheduledDate ? (
              <span className="goal-task-list__meta-chip">
                <CalendarDays size={14} />
                {formatTaskDate(task.dueDate ?? task.scheduledDate ?? "", language)}
              </span>
            ) : null}
            {task.estimatedDurationMinutes ? (
              <span className="goal-task-list__meta-chip">
                <Clock3 size={14} />
                {formatEstimatedDuration(task.estimatedDurationMinutes, language, t)}
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
            {subtaskProgress.total > 0 ? (
              <span className="goal-task-list__meta-chip goal-task-list__meta-chip--success">
                <ListChecks size={14} />
                {t("goals.taskList.subtasksCount", {
                  completed: formatNumber(subtaskProgress.completed, language),
                  total: formatNumber(subtaskProgress.total, language),
                })}
              </span>
            ) : null}
          </div>
          {subtaskProgress.total > 0 ? (
            <div className="goal-task-list__subtasks">
              <div className="goal-task-list__subtasks-header">
                <span className="goal-task-list__subtasks-label">
                  {t("goals.taskList.subtasksCount", {
                    completed: formatNumber(subtaskProgress.completed, language),
                    total: formatNumber(subtaskProgress.total, language),
                  })}
                </span>
                <span className="goal-task-list__subtasks-value">
                  {formatNumber(subtaskPercent, language)}%
                </span>
              </div>
              <div
                aria-hidden="true"
                className={`goal-task-list__subtasks-bar${
                  subtaskProgress.completed === subtaskProgress.total
                    ? " goal-task-list__subtasks-bar--complete"
                    : ""
                }`}
              >
                <span
                  className="goal-task-list__subtasks-bar-fill"
                  style={{ width: `${subtaskPercent}%` }}
                />
              </div>
            </div>
          ) : null}
          {task.status === "done" && subtaskProgress.total > subtaskProgress.completed ? (
            <p className="goal-task-list__warning">
              {t("goals.taskList.incompleteSubtasksWarning", {
                remaining: formatNumber(subtaskProgress.total - subtaskProgress.completed, language),
                total: formatNumber(subtaskProgress.total, language),
              })}
            </p>
          ) : null}
          {task.description ? <p className="goal-task-list__description">{task.description}</p> : null}
        </div>
      </button>

      {taskTreeChildren.length > 0 ? (
        <div className="goal-task-list__tree">
          <TaskTree
            compact
            depth={1}
            nodes={taskTreeChildren}
            onEditTask={onEditTask}
            onToggleComplete={onToggleTask}
          />
        </div>
      ) : null}

      <div className="goal-task-list__quick-actions" aria-label={t("goals.taskList.quickActionsAria", { title: task.title })}>
        {task.status !== "in_progress" ? (
          <button
            aria-label={t("goals.taskList.markInProgressAria", { title: task.title })}
            className="goal-task-list__quick-action"
            onClick={(event) => {
              event.stopPropagation();
              onMarkInProgress(task);
            }}
            type="button"
          >
            <CircleDashed size={15} />
            <span>{t("tasks.inProgress")}</span>
          </button>
        ) : null}
        {task.priority !== "high" ? (
          <button
            aria-label={t("goals.taskList.markHighPriorityAria", { title: task.title })}
            className="goal-task-list__quick-action"
            onClick={(event) => {
              event.stopPropagation();
              onMarkHighPriority(task);
            }}
            type="button"
          >
            <AlertCircle size={15} />
            <span>{t("goals.taskList.highPriorityAction")}</span>
          </button>
        ) : null}
      </div>

      <button
        aria-label={t("goals.taskList.deleteTaskAria", { title: task.title })}
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
  );
}

function getDescendantProgress(task: Task, descendants: Task[]): { completed: number; total: number } {
  if (descendants.length > 0) {
    return {
      completed: descendants.filter((descendant) => descendant.status === "done").length,
      total: descendants.filter((descendant) => descendant.status !== "cancelled").length,
    };
  }

  return task.subtaskProgress;
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

function getTaskStatusLabel(
  status: Task["status"],
  t: (key: string) => string,
): string {
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

function formatEstimatedDuration(
  minutes: number,
  language: "en" | "fa",
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const formattedMinutes = formatNumber(minutes, language);

  if (minutes < 60) {
    return t("goals.taskList.durationMinutes", { minutes: formattedMinutes });
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const formattedHours = formatNumber(hours, language);

  if (remainingMinutes === 0) {
    return t("goals.taskList.durationHours", { hours: formattedHours });
  }

  return t("goals.taskList.durationHoursMinutes", {
    hours: formattedHours,
    minutes: formatNumber(remainingMinutes, language),
  });
}

function formatTaskDate(value: string, language: "en" | "fa"): string {
  const safeDate = new Date(value);
  return Number.isNaN(safeDate.getTime()) ? value : formatAppDate(safeDate, language);
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
