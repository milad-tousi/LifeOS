import { GoalCategory } from "@/domains/goals/types";
import { renderGoalCategoryIcon } from "@/features/goals/components/goal-visuals";
import { useI18n } from "@/i18n";

interface CreateGoalStepCategoryProps {
  category: GoalCategory;
  onChange: (category: GoalCategory) => void;
}

const categories: GoalCategory[] = ["health", "finance", "career", "learning", "lifestyle"];

export function CreateGoalStepCategory({
  category,
  onChange,
}: CreateGoalStepCategoryProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">{t("goals.createFlow.category.title")}</h3>
      <div className="goal-category-grid">
        {categories.map((item) => (
          <button
            className={
              item === category ? "goal-category-option goal-category-option--active" : "goal-category-option"
            }
            key={item}
            onClick={() => onChange(item)}
            type="button"
          >
            <span className="goal-category-option__icon">{renderGoalCategoryIcon(item)}</span>
            <span>{t(`goals.categories.${item}`)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
