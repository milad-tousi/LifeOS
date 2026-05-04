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
      setError("Event title is required.");
      return;
    }

    if (!formState.startDate) {
      setError("Choose a start date for the event.");
      return;
    }

    if (formState.endDate && formState.endDate < formState.startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    if (
      !formState.isAllDay &&
      formState.startDate === (formState.endDate || formState.startDate) &&
      formState.startTime &&
      formState.endTime &&
      formState.endTime <= formState.startTime
    ) {
      setError("End time must be after start time when the event is on the same day.");
      return;
    }

    if (formState.frequency === "weekly" && formState.weeklyDays.length === 0) {
      setError("Choose at least one weekday for a weekly recurring event.");
      return;
    }

    if (
      formState.recurrenceEndMode === "until" &&
      (!formState.recurrenceUntil || formState.recurrenceUntil < formState.startDate)
    ) {
      setError("Recurrence end date must be on or after the start date.");
      return;
    }

    if (
      formState.recurrenceEndMode === "count" &&
      (!formState.recurrenceCount || Number(formState.recurrenceCount) <= 0)
    ) {
      setError("Choose how many times this recurring event should repeat.");
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
          ? "The event could not be updated right now."
          : "The event could not be created right now.",
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
        description="Create one-time, ranged, or repeating events. Editing a recurring event updates the whole series."
        footer={
          <div className="modal-action-row">
            {mode === "edit" ? (
              <Button onClick={() => setShowDeleteConfirm(true)} type="button" variant="ghost">
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="modal-action-row">
              <Button onClick={onClose} type="button" variant="ghost">
                Cancel
              </Button>
              <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
                {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Save event"}
              </Button>
            </div>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={onClose}
        size="wide"
        title={mode === "edit" ? "Edit Event" : "Add Event"}
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Event title</span>
                <input
                  className="auth-form__input"
                  onChange={(inputEvent) =>
                    setFormState((current) => ({ ...current, title: inputEvent.target.value }))
                  }
                  placeholder="Planning workshop, birthday, weekly sync..."
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">Description</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(inputEvent) =>
                    setFormState((current) => ({
                      ...current,
                      description: inputEvent.target.value,
                    }))
                  }
                  placeholder="Optional details, agenda, or notes"
                  value={formState.description}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Start date</span>
                <LocalizedDateInput
                  className="auth-form__input"
                  onChange={(nextValue) =>
                    setFormState((current) => ({ ...current, startDate: nextValue }))
                  }
                  value={formState.startDate}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">End date</span>
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
                <span className="auth-form__label">Start time</span>
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
                <span className="auth-form__label">End time</span>
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
                <span>All day</span>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Repeat</span>
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
                  <option value="none">Does not repeat</option>
                  <option value="daily">Every day</option>
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                  <option value="yearly">Every year</option>
                </select>
              </label>

              {formState.frequency !== "none" ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">Recurrence end</span>
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
                    <option value="never">Never</option>
                    <option value="until">Until date</option>
                    <option value="count">After count</option>
                  </select>
                </label>
              ) : null}

              {formState.frequency === "weekly" ? (
                <div className="auth-form__field task-form-grid__wide">
                  <span className="auth-form__label">Weekdays</span>
                  <div className="task-goal-link__options" role="group" aria-label="Weekly recurrence days">
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
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {formState.frequency !== "none" && formState.recurrenceEndMode === "until" ? (
                <label className="auth-form__field">
                  <span className="auth-form__label">Repeat until</span>
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
                  <span className="auth-form__label">Repeat count</span>
                  <input
                    className="auth-form__input"
                    inputMode="numeric"
                    onChange={(inputEvent) =>
                      setFormState((current) => ({
                        ...current,
                        recurrenceCount: inputEvent.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    placeholder="12"
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
        cancelLabel="Cancel"
        confirmLabel="Delete event"
        description="This event will be removed from the calendar. If it repeats, the whole series will be deleted."
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
        title="Delete this event?"
        tone="danger"
      />
    </>
  );
}
