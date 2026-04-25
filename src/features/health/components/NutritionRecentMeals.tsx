import { Trash2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { calculateMealTotals } from "@/features/health/services/healthCalculations";
import { NutritionMeal } from "@/features/health/types/health.types";

interface NutritionRecentMealsProps {
  meals: NutritionMeal[];
  onDelete: (id: string) => void;
}

export function NutritionRecentMeals({
  meals,
  onDelete,
}: NutritionRecentMealsProps): JSX.Element {
  const recentMeals = meals.slice(0, 10);

  return (
    <Card title="Recent Meals" subtitle="Latest 10 saved meals.">
      {recentMeals.length === 0 ? (
        <EmptyState
          title="No meals yet"
          description="Save a meal to start tracking nutrition locally."
        />
      ) : (
        <div className="health-log-list nutrition-meal-list">
          {recentMeals.map((meal) => {
            const totals = calculateMealTotals(meal);

            return (
              <article className="health-log-card nutrition-meal-card" key={meal.id}>
                <div className="health-log-card__main">
                  <div>
                    <span className="health-log-card__label">Meal</span>
                    <strong>{meal.title}</strong>
                  </div>
                  <div>
                    <span className="health-log-card__label">Date</span>
                    <strong>{formatDate(meal.date)}</strong>
                  </div>
                </div>
                <div className="health-log-card__metrics">
                  <span>{meal.mealType}</span>
                  <span>{Math.round(totals.calories)} kcal</span>
                  <span>Protein {formatNumber(totals.proteinGrams)}g</span>
                  <span>Carbs {formatNumber(totals.carbsGrams)}g</span>
                  <span>Fat {formatNumber(totals.fatGrams)}g</span>
                  <span>Water {formatNumber(meal.waterLiters)}L</span>
                  <span>{meal.items.length} items</span>
                </div>
                <button
                  aria-label={`Delete meal ${meal.title}`}
                  className="icon-button health-log-card__delete"
                  onClick={() => onDelete(meal.id)}
                  title="Delete meal"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function formatDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
