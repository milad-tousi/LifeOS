import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { ModalShell } from "@/components/common/ModalShell";
import { Habit, HabitFrequency, HabitType } from "@/domains/habits/types";
import { HabitCategory } from "@/features/habits/services/habit-categories.storage";
import { CreateHabitInput } from "@/features/habits/services/habits.storage";
import { getTodayDateKey } from "@/features/habits/utils/habit.utils";

interface CreateHabitModalProps {
  categories: HabitCategory[];
  habit?: Habit | null;
  isOpen: boolean;
  onAddCategory: (input: { name: string }) => HabitCategory;
  onClose: () => void;
  onOpenSettings: () => void;
  onSaveHabit: (input: CreateHabitInput) => void;
}

const weekDays = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;

const ADD_CATEGORY_OPTION = "__add_category__";
const MANAGE_CATEGORIES_OPTION = "__manage_categories__";

interface HabitFormState {
  title: string;
  description: string;
  type: HabitType;
  target: string;
  unit: string;
  startDate: string;
  endDate: string;
  frequency: HabitFrequency;
  daysOfWeek: number[];
  category: string;
  reminderEnabled: boolean;
  reminderTime: string;
}

function createInitialFormState(): HabitFormState {
  return {
    title: "",
    description: "",
    type: "binary",
    target: "1",
    unit: "",
    startDate: getTodayDateKey(),
    endDate: "",
    frequency: "daily",
    daysOfWeek: [],
    category: "",
    reminderEnabled: false,
    reminderTime: "",
  };
}

function getFormStateFromHabit(habit: Habit): HabitFormState {
  return {
    title: habit.title,
    description: habit.description ?? "",
    type: habit.type,
    target: habit.target.toString(),
    unit: habit.unit ?? (habit.type === "duration" ? "minutes" : ""),
    startDate: habit.startDate,
    endDate: habit.endDate ?? "",
    frequency: habit.frequency,
    daysOfWeek: habit.daysOfWeek ?? [],
    category: habit.category ?? "",
    reminderEnabled: habit.reminder?.enabled ?? false,
    reminderTime: habit.reminder?.time ?? "",
  };
}

export function CreateHabitModal({
  categories,
  habit,
  isOpen,
  onAddCategory,
  onClose,
  onOpenSettings,
  onSaveHabit,
}: CreateHabitModalProps): JSX.Element {
  const [formState, setFormState] = useState<HabitFormState>(() => createInitialFormState());
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(habit);

  useEffect(() => {
    if (isOpen) {
      setFormState(habit ? getFormStateFromHabit(habit) : createInitialFormState());
      setIsAddingCategory(false);
      setNewCategoryName("");
      setError(null);
    }
  }, [habit, isOpen]);

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
            : currentState.unit === "minutes" || currentState.unit === "hour"
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

  function handleCategorySelect(value: string): void {
    if (value === ADD_CATEGORY_OPTION) {
      setIsAddingCategory(true);
      return;
    }

    if (value === MANAGE_CATEGORIES_OPTION) {
      onOpenSettings();
      return;
    }

    updateField("category", value);
  }

  function handleAddCategory(): void {
    const name = newCategoryName.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    const category = onAddCategory({ name });
    updateField("category", category.id);
    setNewCategoryName("");
    setIsAddingCategory(false);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = formState.title.trim();
    const target = formState.type === "binary" ? 1 : Number(formState.target);

    if (!title) {
      setError("Title is required.");
      return;
    }

    if (!formState.startDate) {
      setError("Start date is required.");
      return;
    }

    if (formState.endDate && formState.endDate < formState.startDate) {
      setError("End date must be after or equal to start date.");
      return;
    }

    if (formState.frequency === "custom" && formState.daysOfWeek.length === 0) {
      setError("Select at least one weekday for custom days.");
      return;
    }

    if (formState.type !== "binary" && (!Number.isFinite(target) || target < 1)) {
      setError("Target must be at least 1.");
      return;
    }

    onSaveHabit({
      title,
      description: formState.description.trim() || undefined,
      type: formState.type,
      target,
      unit: formState.unit.trim() || undefined,
      startDate: formState.startDate,
      endDate: formState.endDate || undefined,
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
      title={isEditing ? "Edit Habit" : "New Habit"}
      description={
        isEditing
          ? "Update this routine while keeping its tracking history."
          : "Set up a lightweight routine you can track today."
      }
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-habit-form">
            {isEditing ? "Save Changes" : "Create Habit"}
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
                  ? "Set the duration needed for completion."
                  : "Set the count needed for completion."}
              </small>
            </label>
          ) : null}
        </div>

        <section className="habit-form__section" aria-label="Schedule">
          <div className="habit-form__section-header">
            <h3>Schedule</h3>
            <p>Choose when this routine should appear in Today's Habits.</p>
          </div>
          <div className="habit-form__grid">
            <label className="habit-form__field">
              <span>Start date</span>
              <input
                type="date"
                value={formState.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                required
              />
            </label>

            <label className="habit-form__field">
              <span>End date</span>
              <input
                type="date"
                value={formState.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
              <small>Optional. Leave empty to keep this habit ongoing.</small>
            </label>
          </div>

          <label className="habit-form__field">
            <span>Frequency</span>
            <select
              value={formState.frequency}
              onChange={(event) => updateField("frequency", event.target.value as HabitFrequency)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom days</option>
            </select>
            {formState.frequency === "weekly" ? (
              <small>This habit repeats weekly on the start date weekday.</small>
            ) : null}
          </label>

          {formState.frequency === "custom" ? (
            <fieldset className="habit-form__days">
              <legend>Custom days</legend>
              <div>
                {weekDays.map((day) => (
                  <button
                    className={
                      formState.daysOfWeek.includes(day.value)
                        ? "habit-day habit-day--selected"
                        : "habit-day"
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
        </section>

        {formState.type !== "binary" ? (
          <div className="habit-form__grid habit-form__grid--single">
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
                <select
                  value={formState.unit || "minutes"}
                  onChange={(event) => updateField("unit", event.target.value)}
                >
                  <option value="minutes">minutes</option>
                  <option value="hour">hour</option>
                </select>
                <small>Choose whether this duration is tracked in minutes or hours.</small>
              </label>
            ) : null}
          </div>
        ) : null}

        <label className="habit-form__field">
          <span>Category</span>
          <select
            value={formState.category}
            onChange={(event) => handleCategorySelect(event.target.value)}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value={ADD_CATEGORY_OPTION}>Add new category</option>
            <option value={MANAGE_CATEGORIES_OPTION}>Manage categories</option>
          </select>
          <small>Categories can be edited in Habit Settings.</small>
        </label>

        {isAddingCategory ? (
          <div className="habit-inline-category">
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="New category name"
            />
            <Button type="button" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        ) : null}

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
