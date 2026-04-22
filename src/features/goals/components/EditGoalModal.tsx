import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flag, Gauge, ListTodo, Tag } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ModalShell } from "@/components/common/ModalShell";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal, GoalCategory, GoalPace, GoalPriority, GoalStatus } from "@/domains/goals/types";

interface EditGoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

interface GoalFormState {
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: GoalPriority;
  pace: GoalPace;
  deadline: string;
}

function createGoalFormState(goal: Goal): GoalFormState {
  return {
    title: goal.title,
    description: goal.description ?? "",
    category: goal.category,
    status: goal.status,
    priority: goal.priority,
    pace: goal.pace,
    deadline: goal.deadline ?? "",
  };
}

export function EditGoalModal({
  goal,
  isOpen,
  onClose,
}: EditGoalModalProps): JSX.Element | null {
  const [formState, setFormState] = useState<GoalFormState | null>(goal ? createGoalFormState(goal) : null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    if (goal && isOpen) {
      setFormState(createGoalFormState(goal));
      setError("");
      setIsSubmitting(false);
      setShowDiscardDialog(false);
    }
  }, [goal, isOpen]);

  const isDirty = useMemo(() => {
    if (!goal || !formState) {
      return false;
    }

    return JSON.stringify(formState) !== JSON.stringify(createGoalFormState(goal));
  }, [formState, goal]);

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
    if (!goal || !formState) {
      return;
    }

    if (!formState.title.trim()) {
      setError("Goal title is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await goalsRepository.update(goal.id, {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        category: formState.category,
        status: formState.status,
        priority: formState.priority,
        pace: formState.pace,
        deadline: formState.deadline || undefined,
      });
      onClose();
    } catch {
      setError("The goal could not be updated locally right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!goal || !isOpen || !formState) {
    return null;
  }

  return (
    <>
      <ModalShell
        description="Update the goal details without touching its linked task list."
        footer={
          <div className="modal-action-row">
            <Button onClick={requestClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={requestClose}
        title="Edit Goal"
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">Goal details</h3>
                <p className="task-editor-section__description">
                  Fine-tune the framing, timing, and urgency of this goal while keeping its tasks intact.
                </p>
              </div>
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Goal title</span>
                <input
                  className="auth-form__input"
                  onChange={(event) => setFormState((current) => current ? { ...current, title: event.target.value } : current)}
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Description</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(event) => setFormState((current) => current ? { ...current, description: event.target.value } : current)}
                  value={formState.description}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Category</span>
                <div className="task-select-wrap">
                  <Tag size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, category: event.target.value as GoalCategory } : current,
                      )
                    }
                    value={formState.category}
                  >
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="career">Career</option>
                    <option value="learning">Learning</option>
                    <option value="lifestyle">Lifestyle</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Status</span>
                <div className="task-select-wrap">
                  <ListTodo size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, status: event.target.value as GoalStatus } : current,
                      )
                    }
                    value={formState.status}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
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
                      setFormState((current) =>
                        current ? { ...current, priority: event.target.value as GoalPriority } : current,
                      )
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
                <span className="auth-form__label">Pace</span>
                <div className="task-select-wrap">
                  <Gauge size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, pace: event.target.value as GoalPace } : current,
                      )
                    }
                    value={formState.pace}
                  >
                    <option value="gentle">Gentle</option>
                    <option value="balanced">Balanced</option>
                    <option value="ambitious">Ambitious</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Target date</span>
                <div className="task-select-wrap">
                  <CalendarDays size={16} />
                  <input
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) =>
                        current ? { ...current, deadline: event.target.value } : current,
                      )
                    }
                    type="date"
                    value={formState.deadline}
                  />
                </div>
              </label>
            </div>

            {error ? <p className="auth-form__error">{error}</p> : null}
          </section>
        </div>
      </ModalShell>

      <ConfirmDialog
        cancelLabel="Keep editing"
        confirmLabel="Discard changes"
        description="You have unsaved goal edits. Close this modal and lose them?"
        isOpen={showDiscardDialog}
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          onClose();
        }}
        title="Discard goal changes?"
        tone="danger"
      />
    </>
  );
}
