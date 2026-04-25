import { useCallback, useState } from "react";
import { Card } from "@/components/common/Card";
import { MealLogForm } from "@/features/health/components/MealLogForm";
import { MealTemplatePanel } from "@/features/health/components/MealTemplatePanel";
import { NutritionOverviewCards } from "@/features/health/components/NutritionOverviewCards";
import { NutritionRecentMeals } from "@/features/health/components/NutritionRecentMeals";
import {
  MealTemplate,
  MealTemplateInput,
  NutritionMeal,
  NutritionMealInput,
  NutritionOverviewStats,
} from "@/features/health/types/health.types";

interface NutritionTabProps {
  meals: NutritionMeal[];
  onDeleteMeal: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  onSaveMeal: (input: NutritionMealInput) => void;
  onSaveTemplate: (input: MealTemplateInput) => void;
  overviewStats: NutritionOverviewStats;
  templates: MealTemplate[];
}

export function NutritionTab({
  meals,
  onDeleteMeal,
  onDeleteTemplate,
  onSaveMeal,
  onSaveTemplate,
  overviewStats,
  templates,
}: NutritionTabProps): JSX.Element {
  const [draftTemplate, setDraftTemplate] = useState<MealTemplate | null>(null);
  const clearDraftTemplate = useCallback(() => setDraftTemplate(null), []);

  return (
    <div className="health-tab-panel">
      <Card
        title="Nutrition"
        subtitle="Track meals, macros, hydration, and reusable meal templates locally."
      />

      <NutritionOverviewCards stats={overviewStats} />

      <div className="nutrition-note">
        Nutrition meals are tracked separately from the quick health log for now.
      </div>

      <div className="nutrition-layout">
        <MealLogForm
          draftTemplate={draftTemplate}
          onDraftTemplateUsed={clearDraftTemplate}
          onSaveMeal={onSaveMeal}
          onSaveTemplate={onSaveTemplate}
        />
        <div className="nutrition-layout__side">
          <MealTemplatePanel
            onDeleteTemplate={onDeleteTemplate}
            onUseTemplate={setDraftTemplate}
            templates={templates}
          />
          <NutritionRecentMeals meals={meals} onDelete={onDeleteMeal} />
        </div>
      </div>
    </div>
  );
}
