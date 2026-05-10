import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { ModalShell } from "@/components/common/ModalShell";
import { calendarEventsRepository } from "@/domains/calendar/repository";
import {
  CalendarEvent,
  CalendarEventRecurrenceFrequency,
  CreateCalendarEventInput,
} from "@/domains/calendar/types";
import { useI18n } from "@/i18n";

interface EventModalProps {
  initialDate?: string;
  isOpen: boolean;
  event?: CalendarEvent | null;
  onClose: () => void;
  onDeleted?: (eventId: string) => void;
  onSaved?: (event: CalendarEvent) => void;
}

type RecurrenceEndMode = "never" | "until" | "count";

interface EventFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  frequency: CalendarEventRecurrenceFrequency;
  weeklyDays: number[];
  recurrenceEndMode: RecurrenceEndMode;
  recurrenceUntil: string;
  recurrenceCount: string;
}

const DEFAULT_FORM_STATE: EventFormState = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  isAllDay: true,
  frequency: "none",
  weeklyDays: [],
  recurrenceEndMode: "never",
  recurrenceUntil: "",
  recurrenceCount: "",
};

const WEEKDAY_OPTIONS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
] as const;

export function EventModal({
  event = null,
  initialDate,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}: EventModalProps): JSX.Element | null {
  const { t } = useI18n();
  const [formState, setFormState] = useState<EventFormState>(DEFAULT_FORM_STATE);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mode = event ? "edit" : "create";
  const initialFormState = useMemo<EventFormState>(() => {
    const recurrence = event?.recurrence;

    return event
      ? {
          title: event.title,
          description: event.description ?? "",
          startDate: event.startDate,
          endDate: event.endDate ?? "",
          startTime: event.startTime ?? "",
          endTime: event.endTime ?? "",
          isAllDay: event.isAllDay,
          frequency: recurrence?.frequency ?? "none",
          weeklyDays: recurrence?.byWeekDays ?? [],
          recurrenceEndMode: recurrence?.count
            ? "count"
            : recurrence?.until
              ? "until"
              : "never",
          recurrenceUntil: recurrence?.until ?? "",
          recurrenceCount: recurrence?.count ? String(recurrence.count) : "",
        }
      : {
          ...DEFAULT_FORM_STATE,
          startDate: initialDate ?? "",
        };
  }, [event, initialDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormState(initialFormState);
    setError("");
    setIsSubmitting(false);
    setShowDeleteConfirm(false);
  }, [initialFormState, isOpen]);

  async function handleSubmit(): Promise<void> {
    if (!formState.title.trim()) {
      setError(t("calendar.modal.errors.titleRequired"));
      return;
    }

    if (!formState.startDate) {
      setError(t("calendar.modal.errors.startDateRequired"));
      return;
    }

    if (formState.endDate && formState.endDate < formState.startDate) {
      setError(t("calendar.modal.errors.endDateBeforeStart"));
      return;
    }

    if (
      !formState.isAllDay &&
      formState.startDate === (formState.endDate || formState.startDate) &&
      formState.startTime &&
      formState.endTime &&
      formState.endTime <= formState.startTime
    ) {
      setError(t("calendar.modal.errors.endTimeBeforeStart"));
      return;
    }

    if (formState.frequency === "weekly" && formState.weeklyDays.length === 0) {
      setError(t("calendar.modal.errors.weekdayRequired"));
      return;
    }

    if (
      formState.recurrenceEndMode === "until" &&
      (!formState.recurrenceUntil || formState.recurrenceUntil < formState.startDate)
    ) {
      setError(t("calendar.modal.errors.recurrenceUntilInvalid"));
      return;
    }

    if (
      formState.recurrenceEndMode === "count" &&
      (!formState.recurrenceCount || Number(formState.recurrenceCount) <= 0)
    ) {
      setError(t("calendar.modal.errors.recurrenceCountRequired"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    const input: CreateCalendarEventInput = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      startDate: formState.startDate,
      endDate: formState.endDate || null,
      startTime: formState.isAllDay ? null : formState.startTime || null,
      endTime: formState.isAllDay ? null : formState.endTime || null,
      isAllDay: formState.isAllDay,
      color: event?.color ?? "#0f766e",
      recurrence:
        formState.frequency === "none"
          ? null
          : {
              frequency: formState.frequency,
              interval: 1,
              byWeekDays: formState.frequency === "weekly" ? formState.weeklyDays : undefined,
              until:
                formState.recurrenceEndMode === "until" ? formState.recurrenceUntil || null : null,
              count:
                formState.recurrenceEndMode === "count"
                  ? Number(formState.recurrenceCount)
                  : null,
            },
    };

    try {
      const savedEvent = event
        ? await calendarEventsRepository.update({
            ...event,
            ...input,
            type: "event",
          })
        : await calendarEventsRepository.add(input);

      onSaved?.(savedEvent);
      onClose();
    } catch {
      setError(
        mode === "edit"
          ? t("calendar.modal.errors.updateFailed")
          : t("calendar.modal.errors.createFailed"),
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
        description={t("calendar.modal.description")}
        footer={
          <div className="modal-action-row">
            {mode === "edit" ? (
              <Button onClick={() => setShowDeleteConfirm(true)} type="button" variant="ghost">
                {t("common.delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="modal-action-row">
              <Button onClick={onClose} type="button" variant="ghost">
                {t("common.cancel")}
              </Button>
              <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
                {isSubmitting
                  ? t("common.saving")
                  : mode === "edit"
                    ? t("calendar.modal.saveChanges")
                    : t("calendar.modal.saveEvent")}
              </Button>
            </div>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={onClose}
        size="wide"
        title={mode === "edit" ? t("calendar.modal.editTitle") : t("calendar.modal.addTitle")}
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("calendar.modal.eventTitle")}</span>
                <input
                  className="auth-form__input"
                  onChange={(inputEvent) =>
                    setFormState((current) => ({ ...current, title: inputEvent.target.value }))
                  }
                  placeholder={t("calendar.modal.placeholders.title")}
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("tasks.modal.description")}</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(inputEvent) =>
                    setFormState((current) => ({
                      ...current,
                      description: inputEvent.target.value,
                    }))
                  }
                  placeholder={t("calendar.modal.placeholders.description")}
                  value={formState.description}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.form.startDate")}</span>
                <LocalizedDateInput
                  className="auth-form__input"
                  onChange={(nextValue) =>
                    setFormState((current) => ({ ...current, startDate: nextValue }))
                  }
                  value={formState.startDate}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.form.endDate")}</span>
                <LocalizedDateInput
                  className="auth-form__input"
                  min={formState.startDate || undefined}
                  onChange={(nextValue) =>
                    setFormState((current) => ({ ...current, endDate: nextValue }))
                  }
                  value={formState.endDate}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("calendar.modal.startTime")}</span>
                <input
                  className="auth-form__input"
                  disabled={formState.isAllDay}
                  onChange={(inputEvent) =>
                    setFormState((current) => ({ ...current, startTime: inputEvent.target.value }))
                  }
                  type="time"
                  value={formState.startTime}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("calendar.modal.endTime")}</span>
                <input
                  className="auth-form__input"
                  disabled={formState.isAllDay}
                  onChange={(inputEvent) =>
                    setFormState((current) => ({ ...current, endTime: inputEvent.target.value }))
                  }
                  type="time"
                  value={formState.endTime}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide task-event-modal__toggle">
                <input
                  checked={formState.isAllDay}
                  onChange={(inputEvent) =>
                    setFormState((current) => ({
                      ...current,
                      isAllDay: inputEvent.target.checked,
                      startTime: inputEvent.target.checked ? "" : current.startTime,
                      endTime: inputEvent.target.checked ? "" : current.endTime,
                    }))
                  }
                  type="checkbox"
                />
                <span>{t("calendar.modal.allDay")}</span>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.form.repeat")}</span>
                <select
                  className="auth-form__input"
                  onChange={(inputEvent) =>
                    setFormState((current) => ({
                      ...current,
                      frequency: inputEvent.target.value as CalendarEventRecurrenceFrequency,
                      weeklyDays:
                        inputEvent.target.value === "weekly"
                          ? current.weeklyDays.length > 0
                            ? current.weeklyDays
                            : [new Date(`${current.startDate || initialDate || "2000-01-03"}T12:00:00`).getDay()]
                          : current.weeklyDays,
                    }))
                  }
                  value={formState.frequency}
                >
                  <option value="none">{t("calendar.modal.repeat.none")}</option>
                  <option value="daily">{t("calendar.modal.repeat.daily")}</option>
                  <option value="weekly">{t("calendar.modal.repeat.weekly")}</option>
                  <option value="monthly">{t("calendar.modal.repeat.monthly")}</option>
                  <option value="yearly">{t("calendar.modal.repeat.yearly")}</option>
                </select>
              </label>

              {formState.frequency !== "none" ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">{t("calendar.modal.recurrenceEnd")}</span>
                  <select
                    className="auth-form__input"
                    onChange={(inputEvent) =>
                      setFormState((current) => ({
                        ...current,
                        recurrenceEndMode: inputEvent.target.value as RecurrenceEndMode,
                      }))
                    }
                    value={formState.recurrenceEndMode}
                  >
                    <option value="never">{t("calendar.modal.recurrenceEndOptions.never")}</option>
                    <option value="until">{t("calendar.modal.recurrenceEndOptions.until")}</option>
                    <option value="count">{t("calendar.modal.recurrenceEndOptions.count")}</option>
                  </select>
                </label>
              ) : null}

              {formState.frequency === "weekly" ? (
                <div className="auth-form__field task-form-grid__wide">
                  <span className="auth-form__label">{t("calendar.modal.weekdays")}</span>
                  <div
                    className="task-goal-link__options"
                    role="group"
                    aria-label={t("calendar.modal.weekdaysAriaLabel")}
                  >
                    {WEEKDAY_OPTIONS.map((option) => {
                      const isActive = formState.weeklyDays.includes(option.value);
                      return (
                        <button
                          className={`task-goal-link__option${
                            isActive ? " task-goal-link__option--active" : ""
                          }`}
                          key={option.value}
                          onClick={() =>
                            setFormState((current) => ({
                              ...current,
                              weeklyDays: isActive
                                ? current.weeklyDays.filter((day) => day !== option.value)
                                : [...current.weeklyDays, option.value].sort((left, right) => left - right),
                            }))
                          }
                          type="button"
                        >
                          {t(`calendar.weekdays.${option.value}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {formState.frequency !== "none" && formState.recurrenceEndMode === "until" ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">{t("calendar.modal.repeatUntil")}</span>
                  <LocalizedDateInput
                    className="auth-form__input"
                    min={formState.startDate || undefined}
                    onChange={(nextValue) =>
                      setFormState((current) => ({
                        ...current,
                        recurrenceUntil: nextValue,
                      }))
                    }
                    value={formState.recurrenceUntil}
                  />
                </label>
              ) : null}

              {formState.frequency !== "none" && formState.recurrenceEndMode === "count" ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">{t("calendar.modal.repeatCount")}</span>
                  <input
                    className="auth-form__input"
                    inputMode="numeric"
                    onChange={(inputEvent) =>
                      setFormState((current) => ({
                        ...current,
                        recurrenceCount: inputEvent.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    placeholder={t("calendar.modal.placeholders.repeatCount")}
                    value={formState.recurrenceCount}
                  />
                </label>
              ) : null}
            </div>

            {error ? <p className="auth-form__error">{error}</p> : null}
          </section>
        </div>
      </ModalShell>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("calendar.modal.deleteEvent")}
        description={t("calendar.modal.deleteDescription")}
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (!event) {
            return;
          }

          setShowDeleteConfirm(false);
          void calendarEventsRepository.remove(event.id).then(() => {
            onDeleted?.(event.id);
            onClose();
          });
        }}
        title={t("calendar.modal.deleteTitle")}
        tone="danger"
      />
    </>
  );
}
