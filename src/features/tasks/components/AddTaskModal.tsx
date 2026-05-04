import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Flag, ListTodo, Tags, Target, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { ModalShell } from "@/components/common/ModalShell";
import { goalsRepository } from "@/domains/goals/repository";
import { tasksRepository } from "@/domains/tasks/repository";
import {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskSubtask,
} from "@/domains/tasks/types";
import { normalizeTask, normalizeTaskTags } from "@/domains/tasks/task.utils";
import { TaskSourcesEditor } from "@/features/tasks/components/TaskSourcesEditor";
import { SubtasksEditor } from "@/features/tasks/components/SubtasksEditor";
import { TaskTree } from "@/features/tasks/components/TaskTree";
import { buildTaskTree, getAllDescendantTasks } from "@/features/tasks/utils/taskHierarchy";

interface TaskModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  goalId?: string;
  goalTitle?: string;
  initialValues?: Partial<CreateTaskInput>;
  initialTask?: Task | null;
  onSaved?: (task: Task) => void;
  onClose: () => void;
}

interface TaskFormState {
  title: string;
  description: string;
  tags: string[];
  goalConnection: "standalone" | "linked";
  selectedGoalId: string;
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
  tags: [],
  goalConnection: "standalone",
  selectedGoalId: "",
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
    tags: normalizeTaskTags(formState.tags),
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

function createEmptyTaskFormState(
  defaultGoalId?: string,
  initialValues?: Partial<CreateTaskInput>,
): TaskFormState {
  return {
    ...DEFAULT_FORM_STATE,
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    tags: normalizeTaskTags(initialValues?.tags ?? []),
    goalConnection: initialValues?.goalId || defaultGoalId ? "linked" : "standalone",
    selectedGoalId: initialValues?.goalId ?? defaultGoalId ?? "",
    status: initialValues?.status ?? "todo",
    priority: initialValues?.priority ?? "medium",
    dueDate: initialValues?.dueDate ?? initialValues?.scheduledDate ?? "",
    estimatedDurationMinutes: initialValues?.estimatedDurationMinutes
      ? String(initialValues.estimatedDurationMinutes)
      : "",
    sources: [],
    subtasks: [],
  };
}

function getFormStateFromTask(task: Task): TaskFormState {
  const normalizedTask = normalizeTask(task);

  return {
    title: normalizedTask.title,
    description: normalizedTask.description ?? "",
    tags: normalizedTask.tags,
    goalConnection: normalizedTask.goalId ? "linked" : "standalone",
    selectedGoalId: normalizedTask.goalId ?? "",
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
  initialValues,
  initialTask = null,
  isOpen,
  mode = "create",
  onSaved,
  onClose,
}: TaskModalProps): JSX.Element | null {
  const [formState, setFormState] = useState<TaskFormState>(createEmptyTaskFormState);
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const goals = useLiveQuery(() => goalsRepository.getAll(), [], []);
  const allTasks = useLiveQuery(() => tasksRepository.getAll(), [], []);
  const taskTree = useMemo(
    () => (mode === "edit" && initialTask ? buildTaskTree(allTasks ?? [], initialTask.id) : null),
    [allTasks, initialTask, mode],
  );
  const descendantTasks = useMemo(
    () => (mode === "edit" && initialTask ? getAllDescendantTasks(allTasks ?? [], initialTask.id) : []),
    [allTasks, initialTask, mode],
  );

  const initialFormState = useMemo(
    () =>
      mode === "edit" && initialTask
        ? getFormStateFromTask(initialTask)
        : createEmptyTaskFormState(goalId, initialValues),
    [goalId, initialTask, initialValues, mode],
  );
  const hasGoals = (goals?.length ?? 0) > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormState(initialFormState);
    setError("");
    setIsSubmitting(false);
    setShowDiscardDialog(false);
    setTagDraft("");
  }, [initialFormState, isOpen]);

  const serializedBaseline = useMemo(() => JSON.stringify(sanitizeFormState(initialFormState)), [
    initialFormState,
  ]);
  const hasPendingTagDraft = tagDraft.trim().length > 0;
  const isDirty = useMemo(
    () => JSON.stringify(sanitizeFormState(formState)) !== serializedBaseline || hasPendingTagDraft,
    [formState, hasPendingTagDraft, serializedBaseline],
  );

  function commitTag(rawTag: string): void {
    const nextTag = rawTag.trim();

    if (!nextTag) {
      setTagDraft("");
      return;
    }

    setFormState((current) => ({
      ...current,
      tags: normalizeTaskTags([...current.tags, nextTag]),
    }));
    setTagDraft("");
  }

  function removeTag(tagToRemove: string): void {
    setFormState((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

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
    const normalizedTags = normalizeTaskTags(
      hasPendingTagDraft ? [...formState.tags, tagDraft] : formState.tags,
    );
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

    if (formState.goalConnection === "linked" && !formState.selectedGoalId) {
      setError("Choose a goal before saving a linked task.");
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
      tags: normalizedTags,
      status: formState.status,
      priority: formState.priority,
      goalId:
        formState.goalConnection === "linked"
          ? formState.selectedGoalId
          : undefined,
      dueDate: formState.dueDate || undefined,
      estimatedDurationMinutes: formState.estimatedDurationMinutes
        ? Number(formState.estimatedDurationMinutes)
        : undefined,
      sources: normalizedSources,
      subtasks: mode === "edit" && initialTask ? initialTask.subtasks : normalizedSubtasks,
    };

    try {
      let savedTask: Task;

      if (mode === "edit" && initialTask) {
        savedTask = await tasksRepository.update({
          ...initialTask,
          title: input.title,
          description: input.description,
          notes: input.description,
          tags: input.tags ?? initialTask.tags,
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

  async function handleAddNestedSubtask(parentTask: Task): Promise<void> {
    const title = window.prompt("Subtask title");

    if (!title?.trim()) {
      return;
    }

    const subtask = await tasksRepository.add({
      title: title.trim(),
      goalId: parentTask.goalId ?? initialTask?.goalId ?? goalId,
      parentTaskId: parentTask.id,
      priority: "medium",
      status: "todo",
    });
    await tasksRepository.update({
      ...parentTask,
      subtasks: [
        ...parentTask.subtasks.filter((item) => item.id !== subtask.id),
        {
          id: subtask.id,
          title: subtask.title,
          description: subtask.description,
          completed: false,
        },
      ],
    });
  }

  async function handleEditNestedTask(task: Task): Promise<void> {
    const title = window.prompt("Task title", task.title);

    if (!title?.trim() || title.trim() === task.title) {
      return;
    }

    await tasksRepository.update({
      ...task,
      title: title.trim(),
    });
  }

  async function handleToggleNestedTask(task: Task): Promise<void> {
    await tasksRepository.toggleTaskComplete(task.id);
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

              <div className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Tags</span>
                <div className="task-tag-editor">
                  <div className="task-select-wrap task-tag-editor__input-wrap">
                    <Tags size={16} />
                    <input
                      className="auth-form__input"
                      onChange={(event) => setTagDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          commitTag(tagDraft);
                        }
                      }}
                      placeholder="Add a tag like design, urgent, or research"
                      value={tagDraft}
                    />
                  </div>
                  <Button
                    onClick={() => commitTag(tagDraft)}
                    type="button"
                    variant="secondary"
                  >
                    Add tag
                  </Button>
                </div>
                {formState.tags.length > 0 ? (
                  <div className="task-tag-list" role="list" aria-label="Task tags">
                    {formState.tags.map((tag) => (
                      <span className="task-tag" key={tag} role="listitem">
                        <span>{tag}</span>
                        <button
                          aria-label={`Remove tag ${tag}`}
                          className="task-tag__remove"
                          onClick={() => removeTag(tag)}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="task-tag-editor__hint">
                    Tags help cluster work quickly without adding visual noise.
                  </p>
                )}
              </div>

              <section className="task-form-grid__wide task-goal-link">
                <div className="task-editor-section__header">
                  <div>
                    <h4 className="task-editor-section__title">Goal connection</h4>
                    <p className="task-editor-section__description">
                      Keep this task standalone or link it to a goal.
                    </p>
                  </div>
                </div>

                <div className="task-goal-link__options" role="radiogroup" aria-label="Task goal connection">
                  <button
                    aria-pressed={formState.goalConnection === "standalone"}
                    className={`task-goal-link__option${
                      formState.goalConnection === "standalone"
                        ? " task-goal-link__option--active"
                        : ""
                    }`}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        goalConnection: "standalone",
                        selectedGoalId: "",
                      }))
                    }
                    type="button"
                  >
                    Standalone
                  </button>
                  <button
                    aria-pressed={formState.goalConnection === "linked"}
                    className={`task-goal-link__option${
                      formState.goalConnection === "linked"
                        ? " task-goal-link__option--active"
                        : ""
                    }`}
                    disabled={!hasGoals}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        goalConnection: "linked",
                        selectedGoalId:
                          current.selectedGoalId || goalId || goals?.[0]?.id || "",
                      }))
                    }
                    type="button"
                  >
                    Linked to goal
                  </button>
                </div>

                {formState.goalConnection === "linked" ? (
                  <label className="auth-form__field">
                    <span className="auth-form__label">Goal</span>
                    <div className="task-select-wrap">
                      <Target size={16} />
                      <select
                        className="auth-form__input"
                        disabled={!hasGoals}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            selectedGoalId: event.target.value,
                          }))
                        }
                        value={formState.selectedGoalId}
                      >
                        <option value="">Select a goal</option>
                        {(goals ?? []).map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                ) : null}

                {!hasGoals ? (
                  <p className="task-goal-link__hint">
                    No goals available yet. Create a goal first.
                  </p>
                ) : null}
              </section>

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
                <LocalizedDateInput
                  className="auth-form__input"
                  onChange={(nextValue) =>
                    setFormState((current) => ({ ...current, dueDate: nextValue }))
                  }
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
            {mode === "edit" && initialTask ? (
              <div className="task-editor-section">
                <div className="task-editor-section__header">
                  <div>
                    <h3 className="task-editor-section__title">Subtasks</h3>
                    <p className="task-editor-section__description">
                      Break the task into smaller milestones. Progress shows{" "}
                      {descendantTasks.filter((task) => task.status === "done").length}/{descendantTasks.length}.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      void handleAddNestedSubtask(initialTask);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Add subtask
                  </Button>
                </div>
                {taskTree && taskTree.children.length > 0 ? (
                  <TaskTree
                    nodes={taskTree.children}
                    depth={1}
                    onAddSubtask={(task) => {
                      void handleAddNestedSubtask(task);
                    }}
                    onEditTask={(task) => {
                      void handleEditNestedTask(task);
                    }}
                    onToggleComplete={(task) => {
                      void handleToggleNestedTask(task);
                    }}
                  />
                ) : (
                  <div className="task-editor-empty-state">
                    <p className="task-editor-empty-state__title">No subtasks yet</p>
                    <p className="task-editor-empty-state__description">
                      Add a few crisp next actions now. Ordering can be layered in later without changing this structure.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <SubtasksEditor
                onChange={(subtasks) => setFormState((current) => ({ ...current, subtasks }))}
                subtasks={formState.subtasks}
              />
            )}
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
