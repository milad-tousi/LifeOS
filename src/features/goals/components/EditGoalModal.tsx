import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flag, Gauge, ListTodo, NotebookText, Tag, Target } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
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
import {
  getGoalCategoryDisplayName,
  getGoalPaceDisplayName,
  getGoalPriorityDisplayName,
  getGoalProgressTypeDisplayName,
  getGoalStatusDisplayName,
  getGoalTargetTypeDisplayName,
} from "@/features/goals/utils/goals.i18n";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
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
      setError(t("goals.edit.errors.titleRequired"));
      return;
    }

    const manualProgress = formState.manualProgress ? Number(formState.manualProgress) : null;
    const targetValue = formState.targetValue ? Number(formState.targetValue) : null;
    const currentValue = formState.currentValue ? Number(formState.currentValue) : null;

    if (formState.progressType === "manual") {
      if (manualProgress === null || Number.isNaN(manualProgress)) {
        setError(t("goals.edit.errors.manualProgressInvalid"));
        return;
      }

      if (manualProgress < 0 || manualProgress > 100) {
        setError(t("goals.edit.errors.manualProgressRange"));
        return;
      }
    }

    if (formState.progressType === "target" && formState.targetType !== "none") {
      if (targetValue === null || Number.isNaN(targetValue) || targetValue <= 0) {
        setError(t("goals.edit.errors.targetValueInvalid"));
        return;
      }

      if (currentValue !== null && (Number.isNaN(currentValue) || currentValue < 0)) {
        setError(t("goals.edit.errors.currentValueInvalid"));
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
      setError(t("goals.edit.errors.updateFailed"));
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
        description={t("goals.edit.description")}
        footer={
          <div className="modal-action-row">
            <Button onClick={requestClose} type="button" variant="ghost">
              {t("common.cancel")}
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
              {isSubmitting ? t("common.saving") : t("goals.edit.saveChanges")}
            </Button>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={requestClose}
        size="wide"
        title={t("goals.edit.title")}
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">{t("goals.edit.sections.detailsTitle")}</h3>
                <p className="task-editor-section__description">
                  {t("goals.edit.sections.detailsDescription")}
                </p>
              </div>
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("goals.createFlow.basic.goalTitle")}</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setFormState((current) => (current ? { ...current, title: event.target.value } : current))
                  }
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("goals.createFlow.basic.description")}</span>
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
                <span className="auth-form__label">{t("goals.edit.fields.category")}</span>
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
                    <option value="health">{getGoalCategoryDisplayName("health", t)}</option>
                    <option value="finance">{getGoalCategoryDisplayName("finance", t)}</option>
                    <option value="career">{getGoalCategoryDisplayName("career", t)}</option>
                    <option value="learning">{getGoalCategoryDisplayName("learning", t)}</option>
                    <option value="lifestyle">{getGoalCategoryDisplayName("lifestyle", t)}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("goals.edit.fields.status")}</span>
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
                    <option value="active">{getGoalStatusDisplayName("active", t)}</option>
                    <option value="paused">{getGoalStatusDisplayName("paused", t)}</option>
                    <option value="completed">{getGoalStatusDisplayName("completed", t)}</option>
                    <option value="archived">{getGoalStatusDisplayName("archived", t)}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("goals.createFlow.meta.priority")}</span>
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
                    <option value="low">{getGoalPriorityDisplayName("low", t)}</option>
                    <option value="medium">{getGoalPriorityDisplayName("medium", t)}</option>
                    <option value="high">{getGoalPriorityDisplayName("high", t)}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("goals.createFlow.meta.pace")}</span>
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
                    <option value="gentle">{getGoalPaceDisplayName("gentle", t)}</option>
                    <option value="balanced">{getGoalPaceDisplayName("balanced", t)}</option>
                    <option value="ambitious">{getGoalPaceDisplayName("ambitious", t)}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("goals.edit.fields.targetDate")}</span>
                <div className="task-select-wrap">
                  <CalendarDays size={16} />
                  <LocalizedDateInput
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) => (current ? { ...current, deadline: event } : current))
                    }
                    value={formState.deadline}
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">{t("goals.edit.sections.progressTitle")}</h3>
                <p className="task-editor-section__description">
                  {t("goals.edit.sections.progressDescription")}
                </p>
              </div>
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field">
                <span className="auth-form__label">{t("goals.edit.fields.progressType")}</span>
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
                    <option value="tasks">{getGoalProgressTypeDisplayName("tasks", t)}</option>
                    <option value="subtasks">{getGoalProgressTypeDisplayName("subtasks", t)}</option>
                    <option value="manual">{getGoalProgressTypeDisplayName("manual", t)}</option>
                    <option value="target">{getGoalProgressTypeDisplayName("target", t)}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("goals.edit.fields.targetType")}</span>
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
                    <option value="none">{getGoalTargetTypeDisplayName("none", t)}</option>
                    <option value="count">{getGoalTargetTypeDisplayName("count", t)}</option>
                    <option value="binary">{getGoalTargetTypeDisplayName("binary", t)}</option>
                    <option value="milestone">{getGoalTargetTypeDisplayName("milestone", t)}</option>
                    <option value="percentage">{getGoalTargetTypeDisplayName("percentage", t)}</option>
                  </select>
                </div>
              </label>

              {showManualProgress ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">{t("goals.edit.fields.manualProgress")}</span>
                  <input
                    className="auth-form__input"
                    inputMode="decimal"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      setFormState((current) =>
                        current
                          ? { ...current, manualProgress: event.target.value.replace(/[^\d.]/g, "") }
                          : current,
                      )
                    }
                    placeholder={t("goals.edit.placeholders.manualProgress")}
                    value={formState.manualProgress}
                  />
                </label>
              ) : null}

              {showTargetNumbers ? (
                <>
                  <label className="auth-form__field">
                    <span className="auth-form__label">{t("goals.edit.fields.targetValue")}</span>
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
                      placeholder={t("goals.edit.placeholders.targetValue")}
                      value={formState.targetValue}
                    />
                  </label>

                  <label className="auth-form__field">
                    <span className="auth-form__label">{t("goals.edit.fields.currentValue")}</span>
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
                      placeholder={t("goals.edit.placeholders.currentValue")}
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
                <h3 className="task-editor-section__title">{t("goals.edit.sections.notesTitle")}</h3>
                <p className="task-editor-section__description">
                  {t("goals.edit.sections.notesDescription")}
                </p>
              </div>
            </div>

            <label className="auth-form__field">
              <span className="auth-form__label">{t("goals.notes")}</span>
              <div className="task-select-wrap">
                <NotebookText size={16} />
                <textarea
                  className="auth-form__input task-modal-textarea task-modal-textarea--with-icon"
                  onChange={(event) =>
                    setFormState((current) => (current ? { ...current, notes: event.target.value } : current))
                  }
                  placeholder={t("goals.edit.placeholders.notes")}
                  value={formState.notes}
                />
              </div>
            </label>

            {error ? <p className="auth-form__error">{error}</p> : null}
          </section>
        </div>
      </ModalShell>

      <ConfirmDialog
        cancelLabel={t("goals.edit.keepEditing")}
        confirmLabel={t("goals.edit.discardChanges")}
        description={t("goals.edit.discardDescription")}
        isOpen={showDiscardDialog}
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          onClose();
        }}
        title={t("goals.edit.discardTitle")}
        tone="danger"
      />
    </>
  );
}
