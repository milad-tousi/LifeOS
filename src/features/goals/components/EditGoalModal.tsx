import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flag, Gauge, ListTodo, NotebookText, Tag, Target } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ModalShell } from "@/components/common/ModalShell";
import { goalsRepository } from "@/domains/goals/repository";
import {
  Goal,
  GoalCategory,
  GoalPace,
  GoalPriority,
  GoalProgressType,
  GoalStatus,
  GoalTargetType,
} from "@/domains/goals/types";

interface EditGoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (goal: Goal) => void;
}

interface GoalFormState {
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  priority: GoalPriority;
  pace: GoalPace;
  deadline: string;
  progressType: GoalProgressType;
  targetType: GoalTargetType;
  targetValue: string;
  currentValue: string;
  manualProgress: string;
  notes: string;
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
    progressType: goal.progressType,
    targetType: goal.targetType,
    targetValue: goal.targetValue !== null && goal.targetValue !== undefined ? String(goal.targetValue) : "",
    currentValue: goal.currentValue !== null && goal.currentValue !== undefined ? String(goal.currentValue) : "",
    manualProgress:
      goal.manualProgress !== null && goal.manualProgress !== undefined ? String(goal.manualProgress) : "",
    notes: goal.notes ?? "",
  };
}

export function EditGoalModal({
  goal,
  isOpen,
  onClose,
  onSaved,
}: EditGoalModalProps): JSX.Element | null {
  const [formState, setFormState] = useState<GoalFormState | null>(
    goal ? createGoalFormState(goal) : null,
  );
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

    const manualProgress = formState.manualProgress ? Number(formState.manualProgress) : null;
    const targetValue = formState.targetValue ? Number(formState.targetValue) : null;
    const currentValue = formState.currentValue ? Number(formState.currentValue) : null;

    if (formState.progressType === "manual") {
      if (manualProgress === null || Number.isNaN(manualProgress)) {
        setError("Manual progress must be a valid number between 0 and 100.");
        return;
      }

      if (manualProgress < 0 || manualProgress > 100) {
        setError("Manual progress must stay between 0 and 100.");
        return;
      }
    }

    if (formState.progressType === "target" && formState.targetType !== "none") {
      if (targetValue === null || Number.isNaN(targetValue) || targetValue <= 0) {
        setError("Target value must be a positive number.");
        return;
      }

      if (currentValue !== null && (Number.isNaN(currentValue) || currentValue < 0)) {
        setError("Current value cannot be negative.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updatedGoal = await goalsRepository.update(goal.id, {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        category: formState.category,
        status: formState.status,
        priority: formState.priority,
        pace: formState.pace,
        deadline: formState.deadline || undefined,
        progressType: formState.progressType,
        targetType: formState.progressType === "target" ? formState.targetType : "none",
        targetValue:
          formState.progressType === "target" && formState.targetType !== "none"
            ? targetValue
            : null,
        currentValue:
          formState.progressType === "target" && formState.targetType !== "none"
            ? currentValue
            : null,
        manualProgress: formState.progressType === "manual" ? manualProgress : null,
        notes: formState.notes.trim(),
      });
      onSaved?.(updatedGoal);
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

  const showManualProgress = formState.progressType === "manual";
  const showTargetFields = formState.progressType === "target";
  const showTargetNumbers = showTargetFields && formState.targetType !== "none";

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
        size="wide"
        title="Edit Goal"
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">Goal details</h3>
                <p className="task-editor-section__description">
                  Fine-tune the framing, measurement mode, and planning notes for this goal.
                </p>
              </div>
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Goal title</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setFormState((current) => (current ? { ...current, title: event.target.value } : current))
                  }
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Description</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(event) =>
                    setFormState((current) =>
                      current ? { ...current, description: event.target.value } : current,
                    )
                  }
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
          </section>

          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">Progress settings</h3>
                <p className="task-editor-section__description">
                  Choose how this goal should measure progress now, so future planning features have a strong base.
                </p>
              </div>
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field">
                <span className="auth-form__label">Progress type</span>
                <div className="task-select-wrap">
                  <Gauge size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              progressType: event.target.value as GoalProgressType,
                              targetType:
                                event.target.value === "target" ? current.targetType : "none",
                              targetValue: event.target.value === "target" ? current.targetValue : "",
                              currentValue: event.target.value === "target" ? current.currentValue : "",
                              manualProgress:
                                event.target.value === "manual" ? current.manualProgress : "",
                            }
                          : current,
                      )
                    }
                    value={formState.progressType}
                  >
                    <option value="tasks">Tasks</option>
                    <option value="subtasks">Subtasks</option>
                    <option value="manual">Manual</option>
                    <option value="target">Target</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Target type</span>
                <div className="task-select-wrap">
                  <Target size={16} />
                  <select
                    className="auth-form__input"
                    disabled={!showTargetFields}
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              targetType: event.target.value as GoalTargetType,
                              targetValue: event.target.value === "none" ? "" : current.targetValue,
                              currentValue: event.target.value === "none" ? "" : current.currentValue,
                            }
                          : current,
                      )
                    }
                    value={formState.targetType}
                  >
                    <option value="none">None</option>
                    <option value="count">Count</option>
                    <option value="binary">Binary</option>
                    <option value="milestone">Milestone</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
              </label>

              {showManualProgress ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">Manual progress</span>
                  <input
                    className="auth-form__input"
                    inputMode="decimal"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? {
                              ...current,
                              manualProgress: event.target.value.replace(/[^\d.]/g, ""),
                            }
                          : current,
                      )
                    }
                    placeholder="0 to 100"
                    value={formState.manualProgress}
                  />
                </label>
              ) : null}

              {showTargetNumbers ? (
                <>
                  <label className="auth-form__field">
                    <span className="auth-form__label">Target value</span>
                    <input
                      className="auth-form__input"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        setFormState((current) =>
                          current
                            ? { ...current, targetValue: event.target.value.replace(/[^\d.]/g, "") }
                            : current,
                        )
                      }
                      placeholder="10"
                      value={formState.targetValue}
                    />
                  </label>

                  <label className="auth-form__field">
                    <span className="auth-form__label">Current value</span>
                    <input
                      className="auth-form__input"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        setFormState((current) =>
                          current
                            ? { ...current, currentValue: event.target.value.replace(/[^\d.]/g, "") }
                            : current,
                        )
                      }
                      placeholder="0"
                      value={formState.currentValue}
                    />
                  </label>
                </>
              ) : null}
            </div>
          </section>

          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">Planning notes</h3>
                <p className="task-editor-section__description">
                  Capture the thinking, assumptions, or milestones behind this goal.
                </p>
              </div>
            </div>

            <label className="auth-form__field">
              <span className="auth-form__label">Notes</span>
              <div className="task-select-wrap">
                <NotebookText size={16} />
                <textarea
                  className="auth-form__input task-modal-textarea task-modal-textarea--with-icon"
                  onChange={(event) =>
                    setFormState((current) => (current ? { ...current, notes: event.target.value } : current))
                  }
                  placeholder="Capture milestones, assumptions, blockers, and planning context"
                  value={formState.notes}
                />
              </div>
            </label>

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
