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
  EventReminder,
  EventReminderUnit,
} from "@/domains/calendar/types";
import { EventLocationPicker } from "@/features/events/components/EventLocationPicker";
import { EventLocation } from "@/features/events/types/location";
import { useI18n } from "@/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventModalProps {
  initialDate?: string;
  isOpen: boolean;
  event?: CalendarEvent | null;
  onClose: () => void;
  onDeleted?: (eventId: string) => void;
  onSaved?: (event: CalendarEvent) => void;
}

type RecurrenceEndMode = "never" | "until" | "count";

type ReminderPreset =
  | "none"
  | "at_time"
  | "5m"
  | "10m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "1d"
  | "custom";

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
  // Location (managed via EventLocationPicker)
  location: EventLocation;
  // Reminder
  reminderPreset: ReminderPreset;
  reminderAmount: string;
  reminderUnit: EventReminderUnit;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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
  location: {},
  reminderPreset: "none",
  reminderAmount: "30",
  reminderUnit: "minute",
};

const WEEKDAY_OPTIONS = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 0 },
] as const;

// ── Reminder helpers ──────────────────────────────────────────────────────────

function reminderToPreset(reminder?: EventReminder | null): ReminderPreset {
  if (!reminder?.enabled) return "none";
  if (reminder.mode === "at_time") return "at_time";
  const { amount, unit } = reminder;
  if (unit === "minute" && amount === 5) return "5m";
  if (unit === "minute" && amount === 10) return "10m";
  if (unit === "minute" && amount === 15) return "15m";
  if (unit === "minute" && amount === 30) return "30m";
  if (unit === "hour" && amount === 1) return "1h";
  if (unit === "hour" && amount === 2) return "2h";
  if (unit === "day" && amount === 1) return "1d";
  return "custom";
}

function presetToReminder(
  preset: ReminderPreset,
  customAmount: string,
  customUnit: EventReminderUnit,
): EventReminder | null {
  if (preset === "none") return { enabled: false };
  if (preset === "at_time") return { enabled: true, mode: "at_time" };
  const presetMap: Record<string, { amount: number; unit: EventReminderUnit }> = {
    "5m": { amount: 5, unit: "minute" },
    "10m": { amount: 10, unit: "minute" },
    "15m": { amount: 15, unit: "minute" },
    "30m": { amount: 30, unit: "minute" },
    "1h": { amount: 1, unit: "hour" },
    "2h": { amount: 2, unit: "hour" },
    "1d": { amount: 1, unit: "day" },
  };
  if (preset in presetMap) {
    const { amount, unit } = presetMap[preset];
    return { enabled: true, mode: "before", amount, unit };
  }
  return {
    enabled: true,
    mode: "before",
    amount: Number(customAmount) || 30,
    unit: customUnit,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventModal({
  event = null,
  initialDate,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}: EventModalProps): JSX.Element | null {
  const { t, direction } = useI18n();
  const isRtl = direction === "rtl";

  const [formState, setFormState] = useState<EventFormState>(DEFAULT_FORM_STATE);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mode = event ? "edit" : "create";

  const initialFormState = useMemo<EventFormState>(() => {
    const recurrence = event?.recurrence;
    const reminderPreset = reminderToPreset(event?.reminder);
    const isCustom = reminderPreset === "custom";

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
          location: {
            locationText: event.locationText,
            locationUrl: event.locationUrl,
            locationLat: event.locationLat,
            locationLng: event.locationLng,
            locationProvider: event.locationProvider,
          },
          reminderPreset,
          reminderAmount: isCustom ? String(event.reminder?.amount ?? 30) : "30",
          reminderUnit: isCustom ? (event.reminder?.unit ?? "minute") : "minute",
        }
      : {
          ...DEFAULT_FORM_STATE,
          startDate: initialDate ?? "",
        };
  }, [event, initialDate]);

  useEffect(() => {
    if (!isOpen) return;
    setFormState(initialFormState);
    setError("");
    setIsSubmitting(false);
    setShowDeleteConfirm(false);
  }, [initialFormState, isOpen]);

  function patch(updates: Partial<EventFormState>): void {
    setFormState((curr) => ({ ...curr, ...updates }));
  }

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
    if (
      formState.reminderPreset === "custom" &&
      (!formState.reminderAmount || Number(formState.reminderAmount) <= 0)
    ) {
      setError(t("calendar.modal.errors.reminderAmountRequired"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    const reminder = presetToReminder(
      formState.reminderPreset,
      formState.reminderAmount,
      formState.reminderUnit,
    );

    const loc = formState.location;

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
              byWeekDays:
                formState.frequency === "weekly" ? formState.weeklyDays : undefined,
              until:
                formState.recurrenceEndMode === "until"
                  ? formState.recurrenceUntil || null
                  : null,
              count:
                formState.recurrenceEndMode === "count"
                  ? Number(formState.recurrenceCount)
                  : null,
            },
      locationText: loc.locationText?.trim() || null,
      locationUrl: loc.locationUrl?.trim() || null,
      locationLat: loc.locationLat ?? null,
      locationLng: loc.locationLng ?? null,
      locationProvider: loc.locationProvider ?? null,
      reminder,
    };

    try {
      const savedEvent = event
        ? await calendarEventsRepository.update({ ...event, ...input, type: "event" })
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

  if (!isOpen) return null;

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

              {/* ── Title ── */}
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("calendar.modal.eventTitle")}</span>
                <input
                  className="auth-form__input"
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder={t("calendar.modal.placeholders.title")}
                  value={formState.title}
                />
              </label>

              {/* ── Description ── */}
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("tasks.modal.description")}</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder={t("calendar.modal.placeholders.description")}
                  value={formState.description}
                />
              </label>

              {/* ── Location ── */}
              <div className="auth-form__field task-form-grid__wide">
                <EventLocationPicker
                  value={formState.location}
                  onChange={(loc) => patch({ location: loc })}
                />
              </div>

              {/* ── Start / End dates ── */}
              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.form.startDate")}</span>
                <LocalizedDateInput
                  className="auth-form__input"
                  onChange={(v) => patch({ startDate: v })}
                  value={formState.startDate}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.form.endDate")}</span>
                <LocalizedDateInput
                  className="auth-form__input"
                  min={formState.startDate || undefined}
                  onChange={(v) => patch({ endDate: v })}
                  value={formState.endDate}
                />
              </label>

              {/* ── Start / End times ── */}
              <label className="auth-form__field">
                <span className="auth-form__label">{t("calendar.modal.startTime")}</span>
                <input
                  className="auth-form__input"
                  disabled={formState.isAllDay}
                  onChange={(e) => patch({ startTime: e.target.value })}
                  type="time"
                  value={formState.startTime}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("calendar.modal.endTime")}</span>
                <input
                  className="auth-form__input"
                  disabled={formState.isAllDay}
                  onChange={(e) => patch({ endTime: e.target.value })}
                  type="time"
                  value={formState.endTime}
                />
              </label>

              {/* ── All Day — direction-aware alignment ── */}
              <label
                className={`auth-form__field task-form-grid__wide task-event-modal__toggle${
                  isRtl ? " task-event-modal__toggle--rtl" : " task-event-modal__toggle--ltr"
                }`}
              >
                <input
                  checked={formState.isAllDay}
                  onChange={(e) =>
                    patch({
                      isAllDay: e.target.checked,
                      startTime: e.target.checked ? "" : formState.startTime,
                      endTime: e.target.checked ? "" : formState.endTime,
                    })
                  }
                  type="checkbox"
                />
                <span>{t("calendar.modal.allDay")}</span>
              </label>

              {/* ── Reminder ── */}
              <label className="auth-form__field">
                <span className="auth-form__label">{t("calendar.modal.reminder")}</span>
                <select
                  className="auth-form__input"
                  onChange={(e) => patch({ reminderPreset: e.target.value as ReminderPreset })}
                  value={formState.reminderPreset}
                >
                  <option value="none">{t("calendar.modal.reminder.none")}</option>
                  <option value="at_time">{t("calendar.modal.reminder.atEventTime")}</option>
                  <option value="5m">{t("calendar.modal.reminder.5m")}</option>
                  <option value="10m">{t("calendar.modal.reminder.10m")}</option>
                  <option value="15m">{t("calendar.modal.reminder.15m")}</option>
                  <option value="30m">{t("calendar.modal.reminder.30m")}</option>
                  <option value="1h">{t("calendar.modal.reminder.1h")}</option>
                  <option value="2h">{t("calendar.modal.reminder.2h")}</option>
                  <option value="1d">{t("calendar.modal.reminder.1d")}</option>
                  <option value="custom">{t("calendar.modal.reminder.custom")}</option>
                </select>
              </label>

              {formState.reminderPreset === "custom" ? (
                <div className="auth-form__field event-modal__custom-reminder">
                  <span className="auth-form__label">{t("calendar.modal.reminder.customLabel")}</span>
                  <div className="event-modal__custom-reminder-row">
                    <input
                      className="auth-form__input event-modal__reminder-amount"
                      inputMode="numeric"
                      min={1}
                      onChange={(e) =>
                        patch({ reminderAmount: e.target.value.replace(/[^\d]/g, "") })
                      }
                      placeholder="30"
                      type="number"
                      value={formState.reminderAmount}
                    />
                    <select
                      className="auth-form__input"
                      onChange={(e) =>
                        patch({ reminderUnit: e.target.value as EventReminderUnit })
                      }
                      value={formState.reminderUnit}
                    >
                      <option value="minute">{t("calendar.modal.reminder.minutes")}</option>
                      <option value="hour">{t("calendar.modal.reminder.hours")}</option>
                      <option value="day">{t("calendar.modal.reminder.days")}</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {/* ── Repeat ── */}
              <label className="auth-form__field">
                <span className="auth-form__label">{t("finance.form.repeat")}</span>
                <select
                  className="auth-form__input"
                  onChange={(e) =>
                    patch({
                      frequency: e.target.value as CalendarEventRecurrenceFrequency,
                      weeklyDays:
                        e.target.value === "weekly"
                          ? formState.weeklyDays.length > 0
                            ? formState.weeklyDays
                            : [
                                new Date(
                                  `${formState.startDate || initialDate || "2000-01-03"}T12:00:00`,
                                ).getDay(),
                              ]
                          : formState.weeklyDays,
                    })
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
                    onChange={(e) =>
                      patch({ recurrenceEndMode: e.target.value as RecurrenceEndMode })
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
                          className={`task-goal-link__option${isActive ? " task-goal-link__option--active" : ""}`}
                          key={option.value}
                          onClick={() =>
                            patch({
                              weeklyDays: isActive
                                ? formState.weeklyDays.filter((d) => d !== option.value)
                                : [...formState.weeklyDays, option.value].sort((a, b) => a - b),
                            })
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
                    onChange={(v) => patch({ recurrenceUntil: v })}
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
                    onChange={(e) =>
                      patch({ recurrenceCount: e.target.value.replace(/[^\d]/g, "") })
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
          if (!event) return;
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
