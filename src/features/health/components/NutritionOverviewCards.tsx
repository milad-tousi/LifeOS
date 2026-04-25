import { Beef, Droplet, Flame, ListChecks, Pizza, Wheat } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DEFAULT_NUTRITION_TARGETS } from "@/features/health/data/nutritionTargets";
import { NutritionOverviewStats } from "@/features/health/types/health.types";

interface NutritionOverviewCardsProps {
  stats: NutritionOverviewStats;
}

export function NutritionOverviewCards({
  stats,
}: NutritionOverviewCardsProps): JSX.Element {
  const cards = [
    {
      title: "Calories",
      value: `${Math.round(stats.todayCalories)} kcal`,
      status: `${stats.calorieTargetProgress}% of ${DEFAULT_NUTRITION_TARGETS.calories}`,
      helper: "Based on today's saved meals.",
      icon: <Flame size={18} />,
      tone: "calories",
    },
    {
      title: "Protein",
      value: `${formatNumber(stats.todayProteinGrams)} g`,
      status: `${stats.proteinTargetProgress}% of ${DEFAULT_NUTRITION_TARGETS.proteinGrams}g`,
      helper: "Tracked separately from the quick health log.",
      icon: <Beef size={18} />,
      tone: "protein",
    },
    {
      title: "Carbs",
      value: `${formatNumber(stats.todayCarbsGrams)} g`,
      status: `Target ${DEFAULT_NUTRITION_TARGETS.carbsGrams}g`,
      helper: "Total carbs from today's meal items.",
      icon: <Wheat size={18} />,
      tone: "carbs",
    },
    {
      title: "Fat",
      value: `${formatNumber(stats.todayFatGrams)} g`,
      status: `Target ${DEFAULT_NUTRITION_TARGETS.fatGrams}g`,
      helper: "Total fat from today's meal items.",
      icon: <Pizza size={18} />,
      tone: "fat",
    },
    {
      title: "Water",
      value: `${formatNumber(stats.todayWaterLiters)} L`,
      status: `Target ${DEFAULT_NUTRITION_TARGETS.waterLiters}L`,
      helper: "Hydration logged inside meals.",
      icon: <Droplet size={18} />,
      tone: "water",
    },
    {
      title: "Meals Today",
      value: stats.todayMealCount.toString(),
      status: `${stats.totalTemplates} templates`,
      helper: "Meals saved locally for today.",
      icon: <ListChecks size={18} />,
      tone: "meals",
    },
  ] as const;

  return (
    <div className="health-overview-grid nutrition-overview-grid">
      {cards.map((card) => (
        <Card key={card.title}>
          <div className={`health-overview-card nutrition-card nutrition-card--${card.tone}`}>
            <div className="health-overview-card__top">
              <span className="health-overview-card__icon">{card.icon}</span>
              <span className="health-overview-card__title">{card.title}</span>
            </div>
            <strong className="health-overview-card__value">{card.value}</strong>
            <span className="health-overview-card__status">{card.status}</span>
            <p className="health-overview-card__helper">{card.helper}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
