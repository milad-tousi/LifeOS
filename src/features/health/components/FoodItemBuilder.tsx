import { Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { calculateMealTotals } from "@/features/health/services/healthCalculations";
import { NutritionFoodItem } from "@/features/health/types/health.types";
import { createId } from "@/lib/id";

interface FoodItemBuilderProps {
  errors: Record<string, string | undefined>;
  items: NutritionFoodItem[];
  onChange: (items: NutritionFoodItem[]) => void;
  waterLiters: number;
}

const EMPTY_ITEM = {
  name: "",
  quantity: 1,
  unit: "serving",
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  fiberGrams: 0,
  sugarGrams: 0,
  sodiumMg: 0,
};

export function FoodItemBuilder({
  errors,
  items,
  onChange,
  waterLiters,
}: FoodItemBuilderProps): JSX.Element {
  const totals = calculateMealTotals({ items, waterLiters });

  function addItem(): void {
    onChange([...items, { ...EMPTY_ITEM, id: createId() }]);
  }

  function updateItem(
    itemId: string,
    field: keyof NutritionFoodItem,
    value: string | number,
  ): void {
    onChange(items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }

  return (
    <div className="food-builder">
      <div className="food-builder__header">
        <div className="food-builder__totals">
          <span>Calories {Math.round(totals.calories)}</span>
          <span>Protein {formatNumber(totals.proteinGrams)}g</span>
          <span>Carbs {formatNumber(totals.carbsGrams)}g</span>
          <span>Fat {formatNumber(totals.fatGrams)}g</span>
        </div>
        <Button onClick={addItem} type="button" variant="secondary">
          Add food
        </Button>
      </div>

      {errors.items ? <p className="auth-form__error">{errors.items}</p> : null}

      <div className="food-builder__list">
        {items.map((item, index) => (
          <article className="food-item-card" key={item.id}>
            <div className="food-item-card__top">
              <strong>{item.name || "Food item"}</strong>
              <Button
                aria-label="Remove food item"
                onClick={() => onChange(items.filter((current) => current.id !== item.id))}
                type="button"
                variant="ghost"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            <div className="food-item-card__grid">
              <FoodTextInput
                error={errors[`${index}.name`]}
                label="Food name"
                onChange={(value) => updateItem(item.id, "name", value)}
                value={item.name}
              />
              <FoodNumberInput
                error={errors[`${index}.quantity`]}
                label="Quantity"
                onChange={(value) => updateItem(item.id, "quantity", value)}
                value={item.quantity}
              />
              <FoodTextInput
                error={undefined}
                label="Unit"
                onChange={(value) => updateItem(item.id, "unit", value)}
                value={item.unit}
              />
              <FoodNumberInput
                error={errors[`${index}.calories`]}
                label="Calories"
                onChange={(value) => updateItem(item.id, "calories", value)}
                value={item.calories}
              />
              <FoodNumberInput
                error={errors[`${index}.proteinGrams`]}
                label="Protein g"
                onChange={(value) => updateItem(item.id, "proteinGrams", value)}
                value={item.proteinGrams}
              />
              <FoodNumberInput
                error={errors[`${index}.carbsGrams`]}
                label="Carbs g"
                onChange={(value) => updateItem(item.id, "carbsGrams", value)}
                value={item.carbsGrams}
              />
              <FoodNumberInput
                error={errors[`${index}.fatGrams`]}
                label="Fat g"
                onChange={(value) => updateItem(item.id, "fatGrams", value)}
                value={item.fatGrams}
              />
              <FoodNumberInput
                error={errors[`${index}.fiberGrams`]}
                label="Fiber g"
                onChange={(value) => updateItem(item.id, "fiberGrams", value)}
                value={item.fiberGrams}
              />
              <FoodNumberInput
                error={errors[`${index}.sugarGrams`]}
                label="Sugar g"
                onChange={(value) => updateItem(item.id, "sugarGrams", value)}
                value={item.sugarGrams}
              />
              <FoodNumberInput
                error={errors[`${index}.sodiumMg`]}
                label="Sodium mg"
                onChange={(value) => updateItem(item.id, "sodiumMg", value)}
                value={item.sodiumMg}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface FoodInputProps {
  error: string | undefined;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

function FoodTextInput({ error, label, onChange, value }: FoodInputProps): JSX.Element {
  return (
    <label className="auth-form__field health-form__field">
      <span className="auth-form__label">{label}</span>
      <input className="auth-form__input" onChange={(event) => onChange(event.target.value)} value={value} />
      {error ? <p className="auth-form__error">{error}</p> : null}
    </label>
  );
}

interface FoodNumberInputProps {
  error: string | undefined;
  label: string;
  onChange: (value: number) => void;
  value: number;
}

function FoodNumberInput({ error, label, onChange, value }: FoodNumberInputProps): JSX.Element {
  return (
    <label className="auth-form__field health-form__field">
      <span className="auth-form__label">{label}</span>
      <input
        className="auth-form__input"
        inputMode="decimal"
        min="0"
        onChange={(event) => onChange(parseNumber(event.target.value))}
        step="0.1"
        type="number"
        value={value}
      />
      {error ? <p className="auth-form__error">{error}</p> : null}
    </label>
  );
}

function parseNumber(value: string): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
