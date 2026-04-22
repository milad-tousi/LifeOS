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
        <div className="subtask-list">
          {subtasks.map((subtask, index) => (
            <article className="subtask-card" key={subtask.id}>
              <div className="subtask-card__handle" title="Reordering can be added later">
                <GripVertical size={16} />
              </div>

              <button
                aria-label={`${subtask.completed ? "Mark incomplete" : "Mark complete"} ${subtask.title || `subtask ${index + 1}`}`}
                className="subtask-card__toggle"
                onClick={() =>
                  updateSubtask(subtask.id, {
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
                    onChange={(event) => updateSubtask(subtask.id, { title: event.target.value })}
                    placeholder="Outline the next step"
                    value={subtask.title}
                  />
                </label>
                <label className="auth-form__field">
                  <span className="auth-form__label">Description</span>
                  <textarea
                    className="auth-form__input task-source-card__textarea"
                    onChange={(event) =>
                      updateSubtask(subtask.id, { description: event.target.value })
                    }
                    placeholder="Optional supporting detail"
                    value={subtask.description ?? ""}
                  />
                </label>
              </div>

              <button
                aria-label={`Delete subtask ${index + 1}`}
                className="subtask-card__remove"
                onClick={() => removeSubtask(subtask.id)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
