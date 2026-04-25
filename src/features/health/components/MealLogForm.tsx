import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { FoodItemBuilder } from "@/features/health/components/FoodItemBuilder";
import { getTodayDateKey } from "@/features/health/services/healthCalculations";
import {
  MealTemplate,
  MealTemplateInput,
  NutritionFoodItem,
  NutritionMealInput,
  NutritionMealType,
} from "@/features/health/types/health.types";

interface MealLogFormProps {
  draftTemplate: MealTemplate | null;
  onDraftTemplateUsed: () => void;
  onSaveMeal: (input: NutritionMealInput) => void;
  onSaveTemplate: (input: MealTemplateInput) => void;
}

interface MealFormState {
  date: string;
  mealType: NutritionMealType;
  title: string;
  waterLiters: string;
  note: string;
}

const MEAL_TYPES: NutritionMealType[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Pre-workout",
  "Post-workout",
  "Custom",
];

export function MealLogForm({
  draftTemplate,
  onDraftTemplateUsed,
  onSaveMeal,
  onSaveTemplate,
}: MealLogFormProps): JSX.Element {
  const [formState, setFormState] = useState<MealFormState>(getEmptyFormState);
  const [items, setItems] = useState<NutritionFoodItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!draftTemplate) {
      return;
    }

    setFormState({
      date: getTodayDateKey(),
      mealType: draftTemplate.mealType,
      title: draftTemplate.title,
      waterLiters: draftTemplate.waterLiters > 0 ? draftTemplate.waterLiters.toString() : "",
      note: draftTemplate.note,
    });
    setItems(draftTemplate.items.map((item) => ({ ...item })));
    setErrors({});
    setSuccessMessage("Template loaded. Edit anything before saving.");
    onDraftTemplateUsed();
  }, [draftTemplate, onDraftTemplateUsed]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    saveMeal();
  }

  function saveMeal(): void {
    const nextErrors = validateMeal(formState, items);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage("");
      return;
    }

    onSaveMeal(toMealInput(formState, items));
    setSuccessMessage("Meal was saved.");
    resetForm();
  }

  function saveTemplate(): void {
    const nextErrors = validateMeal(formState, items);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage("");
      return;
    }

    onSaveTemplate({
      title: formState.title.trim() || formState.mealType,
      mealType: formState.mealType,
      items,
      waterLiters: parseNumber(formState.waterLiters),
      note: formState.note.trim(),
    });
    setSuccessMessage("Meal template was saved.");
  }

  function resetForm(): void {
    setFormState(getEmptyFormState());
    setItems([]);
    setErrors({});
  }

  return (
    <Card title="Meal Log" subtitle="Log meals, macros, and hydration locally.">
      <form className="health-form nutrition-form" onSubmit={handleSubmit}>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Date</span>
          <input
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({ ...current, date: event.target.value }))
            }
            type="date"
            value={formState.date}
          />
        </label>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Meal type</span>
          <select
            className="auth-form__input"
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                mealType: event.target.value as NutritionMealType,
              }))
            }
            value={formState.mealType}
          >
            {MEAL_TYPES.map((mealType) => (
              <option key={mealType} value={mealType}>
                {mealType}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Meal title</span>
          <input
            className="auth-form__input"
            maxLength={80}
            onChange={(event) =>
              setFormState((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Greek yogurt bowl"
            value={formState.title}
          />
          {errors.title ? <p className="auth-form__error">{errors.title}</p> : null}
        </label>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Water liters</span>
          <input
            className="auth-form__input"
            inputMode="decimal"
            min="0"
            onChange={(event) =>
              setFormState((current) => ({ ...current, waterLiters: event.target.value }))
            }
            step="0.1"
            type="number"
            value={formState.waterLiters}
          />
          {errors.waterLiters ? (
            <p className="auth-form__error">{errors.waterLiters}</p>
          ) : null}
        </label>

        <div className="health-form__field--wide">
          <FoodItemBuilder
            errors={errors}
            items={items}
            onChange={setItems}
            waterLiters={parseNumber(formState.waterLiters)}
          />
        </div>

        <label className="auth-form__field health-form__field health-form__field--wide">
          <span className="auth-form__label">Note</span>
          <textarea
            className="auth-form__input health-form__note"
            maxLength={500}
            onChange={(event) =>
              setFormState((current) => ({ ...current, note: event.target.value }))
            }
            placeholder="Preparation, timing, or context"
            value={formState.note}
          />
          {errors.note ? <p className="auth-form__error">{errors.note}</p> : null}
        </label>

        <div className="health-form__footer">
          <div className="health-form__feedback" aria-live="polite">
            {successMessage ? <p>{successMessage}</p> : null}
          </div>
          <div className="health-form__actions">
            <Button onClick={resetForm} type="button" variant="secondary">
              Reset form
            </Button>
            <Button onClick={saveTemplate} type="button" variant="secondary">
              Save as template
            </Button>
            <Button type="submit">Save meal</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function getEmptyFormState(): MealFormState {
  return {
    date: getTodayDateKey(),
    mealType: "Breakfast",
    title: "",
    waterLiters: "",
    note: "",
  };
}

function toMealInput(
  formState: MealFormState,
  items: NutritionFoodItem[],
): NutritionMealInput {
  return {
    date: formState.date,
    mealType: formState.mealType,
    title: formState.title.trim() || formState.mealType,
    items,
    waterLiters: parseNumber(formState.waterLiters),
    note: formState.note.trim(),
  };
}

function validateMeal(
  formState: MealFormState,
  items: NutritionFoodItem[],
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};

  if (formState.title.length > 80) {
    errors.title = "Meal title must be 80 characters or fewer.";
  }

  addRangeError(errors, "waterLiters", parseNumber(formState.waterLiters), 0, 20, "Water");

  if (formState.note.length > 500) {
    errors.note = "Note must be 500 characters or fewer.";
  }

  if (items.length === 0) {
    errors.items = "Add at least one food item.";
  }

  items.forEach((item, index) => {
    if (item.name.length > 80) {
      errors[`${index}.name`] = "Food name must be 80 characters or fewer.";
    }

    addRangeError(errors, `${index}.quantity`, item.quantity, 0, 10000, "Quantity");
    addRangeError(errors, `${index}.calories`, item.calories, 0, 10000, "Calories");
    addRangeError(errors, `${index}.proteinGrams`, item.proteinGrams, 0, 1000, "Protein");
    addRangeError(errors, `${index}.carbsGrams`, item.carbsGrams, 0, 1000, "Carbs");
    addRangeError(errors, `${index}.fatGrams`, item.fatGrams, 0, 1000, "Fat");
    addRangeError(errors, `${index}.fiberGrams`, item.fiberGrams, 0, 1000, "Fiber");
    addRangeError(errors, `${index}.sugarGrams`, item.sugarGrams, 0, 1000, "Sugar");
    addRangeError(errors, `${index}.sodiumMg`, item.sodiumMg, 0, 100000, "Sodium");
  });

  return errors;
}

function addRangeError(
  errors: Record<string, string | undefined>,
  key: string,
  value: number,
  min: number,
  max: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    errors[key] = `${label} must be between ${min} and ${max}.`;
  }
}

function parseNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
