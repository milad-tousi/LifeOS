import { useEffect, useMemo, useState } from "react";
import { Clock3, Flag, ListTodo } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ModalShell } from "@/components/common/ModalShell";
import { tasksRepository } from "@/domains/tasks/repository";
import {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskSubtask,
} from "@/domains/tasks/types";
import { normalizeTask } from "@/domains/tasks/task.utils";
import { TaskSourcesEditor } from "@/features/tasks/components/TaskSourcesEditor";
import { SubtasksEditor } from "@/features/tasks/components/SubtasksEditor";

interface TaskModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  goalId?: string;
  goalTitle?: string;
  initialTask?: Task | null;
  onSaved?: (task: Task) => void;
  onClose: () => void;
}

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedDurationMinutes: string;
  sources: TaskSource[];
  subtasks: TaskSubtask[];
}

const DEFAULT_FORM_STATE: TaskFormState = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  estimatedDurationMinutes: "",
  sources: [],
  subtasks: [],
};

function sanitizeFormState(formState: TaskFormState): TaskFormState {
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

function createEmptyTaskFormState(): TaskFormState {
  return {
    ...DEFAULT_FORM_STATE,
    sources: [],
    subtasks: [],
  };
}

function getFormStateFromTask(task: Task): TaskFormState {
  const normalizedTask = normalizeTask(task);

  return {
    title: normalizedTask.title,
    description: normalizedTask.description ?? "",
    status: normalizedTask.status,
    priority: normalizedTask.priority,
    dueDate: normalizedTask.dueDate ?? normalizedTask.scheduledDate ?? "",
    estimatedDurationMinutes: normalizedTask.estimatedDurationMinutes
      ? String(normalizedTask.estimatedDurationMinutes)
      : "",
    sources: normalizedTask.sources.map((source) => ({
      ...source,
      note: source.note ?? "",
    })),
    subtasks: normalizedTask.subtasks.map((subtask) => ({
      ...subtask,
      description: subtask.description ?? "",
    })),
  };
}

export function TaskModal({
  goalId,
  goalTitle,
  initialTask = null,
  isOpen,
  mode = "create",
  onSaved,
  onClose,
}: TaskModalProps): JSX.Element | null {
  const [formState, setFormState] = useState<TaskFormState>(createEmptyTaskFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const initialFormState = useMemo(
    () =>
      mode === "edit" && initialTask
        ? getFormStateFromTask(initialTask)
        : createEmptyTaskFormState(),
    [initialTask, mode],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormState(initialFormState);
    setError("");
    setIsSubmitting(false);
    setShowDiscardDialog(false);
  }, [initialFormState, isOpen]);

  const serializedBaseline = useMemo(() => JSON.stringify(sanitizeFormState(initialFormState)), [
    initialFormState,
  ]);
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
      (source) => source.type === "link" && source.value && !isValidUrl(source.value),
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
      goalId: initialTask?.goalId ?? goalId,
      dueDate: formState.dueDate || undefined,
      estimatedDurationMinutes: formState.estimatedDurationMinutes
        ? Number(formState.estimatedDurationMinutes)
        : undefined,
      sources: normalizedSources,
      subtasks: normalizedSubtasks,
    };

    try {
      let savedTask: Task;

      if (mode === "edit" && initialTask) {
        savedTask = await tasksRepository.update({
          ...initialTask,
          title: input.title,
          description: input.description,
          notes: input.description,
          status: input.status ?? initialTask.status,
          priority: input.priority ?? initialTask.priority,
          goalId: input.goalId,
          dueDate: input.dueDate,
          scheduledDate: input.dueDate,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          sources: input.sources ?? initialTask.sources,
          subtasks: input.subtasks ?? initialTask.subtasks,
        });
      } else if (goalId) {
        savedTask = await tasksRepository.addTaskToGoal(goalId, input);
      } else {
        savedTask = await tasksRepository.add(input);
      }

      onSaved?.(savedTask);
      onClose();
    } catch {
      setError(
        mode === "edit"
          ? "The task could not be updated locally right now."
          : "The task could not be saved locally right now.",
      );
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
          mode === "edit"
            ? "Update this task without losing its linked sources, subtasks, or progress context."
            : goalTitle
              ? `Create a new task for ${goalTitle} with richer context, sources, and subtasks.`
              : "Create a new task with attachments, subtasks, and scheduling details."
        }
        footer={
          <div className="modal-action-row">
            <Button onClick={requestClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Save task"}
            </Button>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={requestClose}
        size="wide"
        title={mode === "edit" ? "Edit Task" : goalTitle ? `Add Task to ${goalTitle}` : "Add Task"}
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
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Ship the goal's next meaningful step"
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
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, dueDate: event.target.value }))
                  }
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

export const AddTaskModal = TaskModal;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
