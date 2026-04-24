import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { HabitFrequency, HabitType } from "@/domains/habits/types";
import { CreateHabitInput } from "@/features/habits/services/habits.storage";

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHabit: (input: CreateHabitInput) => void;
}

const weekDays = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
] as const;

interface HabitFormState {
  title: string;
  description: string;
  type: HabitType;
  target: string;
  unit: string;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  category: string;
  reminderEnabled: boolean;
  reminderTime: string;
}

const initialFormState: HabitFormState = {
  title: "",
  description: "",
  type: "binary",
  target: "1",
  unit: "",
  frequency: "daily",
  daysOfWeek: [],
  category: "",
  reminderEnabled: false,
  reminderTime: "",
};

export function CreateHabitModal({
  isOpen,
  onClose,
  onCreateHabit,
}: CreateHabitModalProps): JSX.Element {
  const [formState, setFormState] = useState<HabitFormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState);
      setError(null);
    }
  }, [isOpen]);

  function updateField<Key extends keyof HabitFormState>(
    key: Key,
    value: HabitFormState[Key],
  ): void {
    setFormState((currentState) => ({ ...currentState, [key]: value }));
  }

  function handleTypeChange(type: HabitType): void {
    setFormState((currentState) => ({
      ...currentState,
      type,
      target: type === "binary" ? "1" : currentState.target,
      unit:
        type === "binary"
          ? ""
          : type === "duration"
            ? "minutes"
            : currentState.unit === "minutes"
              ? ""
              : currentState.unit,
    }));
  }

  function toggleDay(day: number): void {
    setFormState((currentState) => {
      const hasDay = currentState.daysOfWeek.includes(day);

      return {
        ...currentState,
        daysOfWeek: hasDay
          ? currentState.daysOfWeek.filter((item) => item !== day)
          : [...currentState.daysOfWeek, day],
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = formState.title.trim();
    const target = formState.type === "binary" ? 1 : Number(formState.target);

    if (!title) {
      setError("Title is required.");
      return;
    }

    if (formState.type !== "binary" && (!Number.isFinite(target) || target < 1)) {
      setError("Target must be at least 1.");
      return;
    }

    onCreateHabit({
      title,
      description: formState.description.trim() || undefined,
      type: formState.type,
      target,
      unit: formState.unit.trim() || undefined,
      frequency: formState.frequency,
      daysOfWeek: formState.frequency === "custom" ? formState.daysOfWeek : undefined,
      category: formState.category.trim() || undefined,
      reminder: {
        enabled: formState.reminderEnabled,
        time: formState.reminderEnabled ? formState.reminderTime || undefined : undefined,
      },
    });
    onClose();
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onRequestClose={onClose}
      title="New Habit"
      description="Set up a lightweight routine you can track today."
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-habit-form">
            Create Habit
          </Button>
        </>
      }
    >
      <form className="habit-form" id="create-habit-form" onSubmit={handleSubmit}>
        <label className="habit-form__field">
          <span>Title</span>
          <input
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Morning walk"
            required
          />
          <small>Name the action you want to repeat.</small>
        </label>

        <label className="habit-form__field">
          <span>Description</span>
          <textarea
            value={formState.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="A short note about this routine"
            rows={3}
          />
          <small>Optional context for why this habit matters.</small>
        </label>

        <div
          className={
            formState.type === "binary" ? "habit-form__grid habit-form__grid--single" : "habit-form__grid"
          }
        >
          <label className="habit-form__field">
            <span>Type</span>
            <select
              value={formState.type}
              onChange={(event) => handleTypeChange(event.target.value as HabitType)}
            >
              <option value="binary">Binary</option>
              <option value="count">Count</option>
              <option value="duration">Duration</option>
            </select>
            <small>Choose how this habit should be measured.</small>
          </label>

          {formState.type !== "binary" ? (
            <label className="habit-form__field">
              <span>Target</span>
              <input
                min={1}
                type="number"
                value={formState.target}
                onChange={(event) => updateField("target", event.target.value)}
              />
              <small>
                {formState.type === "duration"
                  ? "Set the number of minutes for completion."
                  : "Set the count needed for completion."}
              </small>
            </label>
          ) : null}
        </div>

        <div
          className={
            formState.type === "binary" ? "habit-form__grid habit-form__grid--single" : "habit-form__grid"
          }
        >
          {formState.type === "count" ? (
            <label className="habit-form__field">
              <span>Unit</span>
              <input
                value={formState.unit}
                onChange={(event) => updateField("unit", event.target.value)}
                placeholder="times"
              />
              <small>Examples: pages, glasses, sets, times.</small>
            </label>
          ) : null}

          {formState.type === "duration" ? (
            <label className="habit-form__field">
              <span>Unit</span>
              <input value="minutes" disabled readOnly />
              <small>Duration habits are tracked in minutes.</small>
            </label>
          ) : null}

          <label className="habit-form__field">
            <span>Frequency</span>
            <select
              value={formState.frequency}
              onChange={(event) => updateField("frequency", event.target.value as HabitFrequency)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
            <small>Custom frequency lets you choose weekdays.</small>
          </label>
        </div>

        {formState.frequency === "custom" ? (
          <fieldset className="habit-form__days">
            <legend>Days of week</legend>
            <div>
              {weekDays.map((day) => (
                <button
                  className={
                    formState.daysOfWeek.includes(day.value) ? "habit-day habit-day--selected" : "habit-day"
                  }
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <label className="habit-form__field">
          <span>Category</span>
          <input
            value={formState.category}
            onChange={(event) => updateField("category", event.target.value)}
            placeholder="Health"
          />
          <small>Use a simple group like Health, Focus, or Home.</small>
        </label>

        <label className="habit-form__check">
          <input
            checked={formState.reminderEnabled}
            type="checkbox"
            onChange={(event) => updateField("reminderEnabled", event.target.checked)}
          />
          <span>Reminder enabled</span>
        </label>

        {formState.reminderEnabled ? (
          <label className="habit-form__field">
            <span>Reminder time</span>
            <input
              type="time"
              value={formState.reminderTime}
              onChange={(event) => updateField("reminderTime", event.target.value)}
            />
            <small>Stored only as a preference for now.</small>
          </label>
        ) : null}

        {error ? <p className="habit-form__error">{error}</p> : null}
      </form>
    </ModalShell>
  );
}
