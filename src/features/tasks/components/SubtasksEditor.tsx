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
import { GripVertical, Plus, Square, SquareCheckBig, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { createId } from "@/lib/id";
import { TaskSubtask } from "@/domains/tasks/types";

interface SubtasksEditorProps {
  subtasks: TaskSubtask[];
  onChange: (subtasks: TaskSubtask[]) => void;
}

function createEmptySubtask(): TaskSubtask {
  return {
    id: createId(),
    title: "",
    description: "",
    completed: false,
  };
}

export function SubtasksEditor({
  onChange,
  subtasks,
}: SubtasksEditorProps): JSX.Element {
  const completedCount = subtasks.filter((subtask) => subtask.completed).length;
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

  function addSubtask(): void {
    onChange([...subtasks, createEmptySubtask()]);
  }

  function updateSubtask(subtaskId: string, patch: Partial<TaskSubtask>): void {
    onChange(
      subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, ...patch } : subtask)),
    );
  }

  function removeSubtask(subtaskId: string): void {
    onChange(subtasks.filter((subtask) => subtask.id !== subtaskId));
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = subtasks.findIndex((subtask) => subtask.id === active.id);
    const newIndex = subtasks.findIndex((subtask) => subtask.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedSubtasks = [...subtasks];
    const [movedSubtask] = reorderedSubtasks.splice(oldIndex, 1);
    reorderedSubtasks.splice(newIndex, 0, movedSubtask);
    onChange(reorderedSubtasks);
  }

  return (
    <div className="task-editor-section">
      <div className="task-editor-section__header">
        <div>
          <h3 className="task-editor-section__title">Subtasks</h3>
          <p className="task-editor-section__description">
            Break the task into smaller milestones. Progress shows {completedCount}/{subtasks.length}.
          </p>
        </div>
        <Button onClick={addSubtask} type="button" variant="secondary">
          <Plus size={16} />
          Add subtask
        </Button>
      </div>

      {subtasks.length === 0 ? (
        <div className="task-editor-empty-state">
          <p className="task-editor-empty-state__title">No subtasks yet</p>
          <p className="task-editor-empty-state__description">
            Add a few crisp next actions now. Ordering can be layered in later without changing this structure.
          </p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext
            items={subtasks.map((subtask) => subtask.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="subtask-list">
              {subtasks.map((subtask, index) => (
                <SortableSubtaskCard
                  index={index}
                  key={subtask.id}
                  onRemove={removeSubtask}
                  onToggle={updateSubtask}
                  onUpdate={updateSubtask}
                  subtask={subtask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface SortableSubtaskCardProps {
  index: number;
  onRemove: (subtaskId: string) => void;
  onToggle: (subtaskId: string, patch: Partial<TaskSubtask>) => void;
  onUpdate: (subtaskId: string, patch: Partial<TaskSubtask>) => void;
  subtask: TaskSubtask;
}

function SortableSubtaskCard({
  index,
  onRemove,
  onToggle,
  onUpdate,
  subtask,
}: SortableSubtaskCardProps): JSX.Element {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subtask.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={`subtask-card${isDragging ? " subtask-card--dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label={`Reorder ${subtask.title || `subtask ${index + 1}`}`}
        className="subtask-card__handle"
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <button
        aria-label={`${subtask.completed ? "Mark incomplete" : "Mark complete"} ${subtask.title || `subtask ${index + 1}`}`}
        className="subtask-card__toggle"
        onClick={() =>
          onToggle(subtask.id, {
            completed: !subtask.completed,
          })
        }
        type="button"
      >
        {subtask.completed ? <SquareCheckBig size={18} /> : <Square size={18} />}
      </button>

      <div className="subtask-card__fields">
        <label className="auth-form__field">
          <span className="auth-form__label">Title</span>
          <input
            className="auth-form__input"
            onChange={(event) => onUpdate(subtask.id, { title: event.target.value })}
            placeholder="Outline the next step"
            value={subtask.title}
          />
        </label>
        <label className="auth-form__field">
          <span className="auth-form__label">Description</span>
          <textarea
            className="auth-form__input task-source-card__textarea"
            onChange={(event) => onUpdate(subtask.id, { description: event.target.value })}
            placeholder="Optional supporting detail"
            value={subtask.description ?? ""}
          />
        </label>
      </div>

      <button
        aria-label={`Delete subtask ${index + 1}`}
        className="subtask-card__remove"
        onClick={() => onRemove(subtask.id)}
        type="button"
      >
        <Trash2 size={16} />
      </button>
    </article>
  );
}
