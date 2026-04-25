import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { calculateMealTotals } from "@/features/health/services/healthCalculations";
import { MealTemplate, NutritionMealType } from "@/features/health/types/health.types";

interface MealTemplatePanelProps {
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: MealTemplate) => void;
  templates: MealTemplate[];
}

const MEAL_FILTERS: Array<"All" | NutritionMealType> = [
  "All",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Pre-workout",
  "Post-workout",
  "Custom",
];

export function MealTemplatePanel({
  onDeleteTemplate,
  onUseTemplate,
  templates,
}: MealTemplatePanelProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [mealType, setMealType] = useState<"All" | NutritionMealType>("All");
  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const matchesSearch = template.title
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());
        const matchesMealType = mealType === "All" || template.mealType === mealType;

        return matchesSearch && matchesMealType;
      }),
    [mealType, searchTerm, templates],
  );

  return (
    <Card title="Meal Templates" subtitle="Reuse frequent meals without retyping.">
      <div className="meal-template-panel">
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Search</span>
          <input
            className="auth-form__input"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search templates"
            value={searchTerm}
          />
        </label>
        <label className="auth-form__field health-form__field">
          <span className="auth-form__label">Meal type</span>
          <select
            className="auth-form__input"
            onChange={(event) => setMealType(event.target.value as "All" | NutritionMealType)}
            value={mealType}
          >
            {MEAL_FILTERS.map((filter) => (
              <option key={filter} value={filter}>
                {filter}
              </option>
            ))}
          </select>
        </label>

        {filteredTemplates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            description="Save a meal as a template to reuse it later."
          />
        ) : (
          <div className="meal-template-panel__list">
            {filteredTemplates.map((template) => {
              const totals = calculateMealTotals(template);

              return (
                <article className="meal-template-card" key={template.id}>
                  <div>
                    <strong>{template.title}</strong>
                    <span>{template.mealType}</span>
                    <small>
                      {Math.round(totals.calories)} kcal | {formatNumber(totals.proteinGrams)}g
                      protein | {template.items.length} items
                    </small>
                  </div>
                  <div className="meal-template-card__actions">
                    <Button onClick={() => onUseTemplate(template)} type="button" variant="secondary">
                      Use template
                    </Button>
                    <Button onClick={() => onDeleteTemplate(template.id)} type="button" variant="ghost">
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
