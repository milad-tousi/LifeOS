import { GoalCategory } from "@/domains/goals/types";
import { renderGoalCategoryIcon } from "@/features/goals/components/goal-visuals";

interface CreateGoalStepCategoryProps {
  category: GoalCategory;
  onChange: (category: GoalCategory) => void;
}

const categories: GoalCategory[] = ["health", "finance", "career", "learning", "lifestyle"];

export function CreateGoalStepCategory({
  category,
  onChange,
}: CreateGoalStepCategoryProps): JSX.Element {
  return (
    <section className="goal-create-step">
      <h3 className="goal-create-step__title">Choose a category</h3>
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
            <span>{item}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
