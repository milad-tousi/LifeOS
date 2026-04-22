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

interface GoalTaskListProps {
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

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No steps yet"
        description="No steps yet. Add tasks to start making progress."
      />
    );
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedTasks = [...tasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    onReorderTasks(
      reorderedTasks.map((task, index) => ({
        ...task,
        sortOrder: index,
      })),
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="goal-task-list">
          {tasks.map((task) => (
            <SortableTaskItem
              deletingTaskId={deletingTaskId}
              key={task.id}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onMarkHighPriority={onMarkHighPriority}
              onMarkInProgress={onMarkInProgress}
              onToggleTask={onToggleTask}
              recentTaskId={recentTaskId}
              recentTaskTone={recentTaskTone}
              task={task}
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
}: SortableTaskItemProps): JSX.Element {
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
        aria-label={`Reorder task ${task.title}`}
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
        aria-label={`Toggle ${task.title}`}
        className={`goal-task-list__toggle${
          task.status === "done" ? " goal-task-list__toggle--done" : ""
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleTask(task);
        }}
        type="button"
      >
        <span className="goal-task-list__toggle-icon">
          {renderTaskStatusIcon(task.status)}
        </span>
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
              <span className="goal-task-list__title-text">{task.title}</span>
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
                  {Math.round((task.subtaskProgress.completed / task.subtaskProgress.total) * 100)}
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
          {task.description ? <p className="goal-task-list__description">{task.description}</p> : null}
        </div>
      </button>

      <div className="goal-task-list__quick-actions" aria-label={`Quick actions for ${task.title}`}>
        {task.status !== "in_progress" ? (
          <button
            aria-label={`Mark ${task.title} in progress`}
            className="goal-task-list__quick-action"
            onClick={(event) => {
              event.stopPropagation();
              onMarkInProgress(task);
            }}
            type="button"
          >
            <CircleDashed size={15} />
            <span>In progress</span>
          </button>
        ) : null}
        {task.priority !== "high" ? (
          <button
            aria-label={`Mark ${task.title} high priority`}
            className="goal-task-list__quick-action"
            onClick={(event) => {
              event.stopPropagation();
              onMarkHighPriority(task);
            }}
            type="button"
          >
            <AlertCircle size={15} />
            <span>High priority</span>
          </button>
        ) : null}
      </div>

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
