import { useEffect, useMemo, useState } from "react";
import { Clock3, Flag, ListTodo } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ModalShell } from "@/components/common/ModalShell";
import { tasksRepository } from "@/domains/tasks/repository";
import { CreateTaskInput, TaskPriority, TaskSource, TaskStatus, TaskSubtask } from "@/domains/tasks/types";
import { TaskSourcesEditor } from "@/features/tasks/components/TaskSourcesEditor";
import { SubtasksEditor } from "@/features/tasks/components/SubtasksEditor";

interface AddTaskModalProps {
  isOpen: boolean;
  goalId?: string;
  goalTitle?: string;
  onClose: () => void;
}

interface AddTaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedDurationMinutes: string;
  sources: TaskSource[];
  subtasks: TaskSubtask[];
}

const DEFAULT_FORM_STATE: AddTaskFormState = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  estimatedDurationMinutes: "",
  sources: [],
  subtasks: [],
};

function sanitizeFormState(formState: AddTaskFormState): AddTaskFormState {
  return {
    ...formState,
    title: formState.title.trim(),
    description: formState.description.trim(),
    dueDate: formState.dueDate,
    estimatedDurationMinutes: formState.estimatedDurationMinutes.trim(),
    sources: formState.sources.map((source) => ({
      ...source,
      label: source.label.trim(),
      value: source.value.trim(),
      note: source.note?.trim() ?? "",
    })),
    subtasks: formState.subtasks.map((subtask) => ({
      ...subtask,
      title: subtask.title.trim(),
      description: subtask.description?.trim() ?? "",
    })),
  };
}

function getInitialTaskFormState(): AddTaskFormState {
  return {
    ...DEFAULT_FORM_STATE,
    sources: [],
    subtasks: [],
  };
}

export function AddTaskModal({
  goalId,
  goalTitle,
  isOpen,
  onClose,
}: AddTaskModalProps): JSX.Element | null {
  const [formState, setFormState] = useState<AddTaskFormState>(getInitialTaskFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormState(getInitialTaskFormState());
      setError("");
      setIsSubmitting(false);
      setShowDiscardDialog(false);
    }
  }, [isOpen]);

  const serializedBaseline = JSON.stringify(DEFAULT_FORM_STATE);
  const isDirty = useMemo(
    () => JSON.stringify(sanitizeFormState(formState)) !== serializedBaseline,
    [formState, serializedBaseline],
  );

  function requestClose(): void {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      setShowDiscardDialog(true);
      return;
    }

    onClose();
  }

  async function handleSubmit(): Promise<void> {
    const normalizedSources = formState.sources
      .map((source) => ({
        ...source,
        label: source.label.trim(),
        value: source.value.trim(),
        note: source.note?.trim() || undefined,
        previewUrl: source.origin === "local" ? undefined : source.previewUrl,
      }))
      .filter((source) => source.label || source.value || source.note);
    const normalizedSubtasks = formState.subtasks
      .map((subtask) => ({
        ...subtask,
        title: subtask.title.trim(),
        description: subtask.description?.trim() || undefined,
      }))
      .filter((subtask) => subtask.title);

    if (!formState.title.trim()) {
      setError("Task title is required.");
      return;
    }

    const invalidLink = normalizedSources.find(
      (source) =>
        source.type === "link" &&
        source.value &&
        !isValidUrl(source.value),
    );

    if (invalidLink) {
      setError(`The link source "${invalidLink.label || invalidLink.value}" needs a valid URL.`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const input: CreateTaskInput = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      status: formState.status,
      priority: formState.priority,
      goalId,
      dueDate: formState.dueDate || undefined,
      estimatedDurationMinutes: formState.estimatedDurationMinutes
        ? Number(formState.estimatedDurationMinutes)
        : undefined,
      sources: normalizedSources,
      subtasks: normalizedSubtasks,
    };

    try {
      if (goalId) {
        await tasksRepository.addTaskToGoal(goalId, input);
      } else {
        await tasksRepository.add(input);
      }

      onClose();
    } catch {
      setError("The task could not be saved locally right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <ModalShell
        description={
          goalTitle
            ? `Create a new task for ${goalTitle} with richer context, sources, and subtasks.`
            : "Create a new task with attachments, subtasks, and scheduling details."
        }
        footer={
          <div className="modal-action-row">
            <Button onClick={requestClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
              {isSubmitting ? "Saving..." : "Save task"}
            </Button>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={requestClose}
        size="wide"
        title={goalTitle ? `Add Task to ${goalTitle}` : "Add Task"}
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">Basic info</h3>
                <p className="task-editor-section__description">
                  Capture the task clearly now so execution later feels lighter.
                </p>
              </div>
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Task title</span>
                <input
                  className="auth-form__input"
                  onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ship the goal’s next meaningful step"
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Description</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Optional context, definition of done, or notes for future you"
                  value={formState.description}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Status</span>
                <div className="task-select-wrap">
                  <ListTodo size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                    value={formState.status}
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Priority</span>
                <div className="task-select-wrap">
                  <Flag size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        priority: event.target.value as TaskPriority,
                      }))
                    }
                    value={formState.priority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Due date</span>
                <input
                  className="auth-form__input"
                  onChange={(event) => setFormState((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                  value={formState.dueDate}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Estimated duration</span>
                <div className="task-select-wrap">
                  <Clock3 size={16} />
                  <input
                    className="auth-form__input"
                    inputMode="numeric"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        estimatedDurationMinutes: event.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    placeholder="90 minutes"
                    value={formState.estimatedDurationMinutes}
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="task-editor-section task-editor-section--surface">
            <TaskSourcesEditor
              onChange={(sources) => setFormState((current) => ({ ...current, sources }))}
              sources={formState.sources}
            />
          </section>

          <section className="task-editor-section task-editor-section--surface">
            <SubtasksEditor
              onChange={(subtasks) => setFormState((current) => ({ ...current, subtasks }))}
              subtasks={formState.subtasks}
            />
          </section>

          {error ? <p className="auth-form__error">{error}</p> : null}
        </div>
      </ModalShell>

      <ConfirmDialog
        cancelLabel="Keep editing"
        confirmLabel="Discard changes"
        description="You have unsaved task edits. Close this modal and lose them?"
        isOpen={showDiscardDialog}
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          onClose();
        }}
        title="Discard task draft?"
        tone="danger"
      />
    </>
  );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
