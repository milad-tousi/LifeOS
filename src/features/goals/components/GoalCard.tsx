import { CalendarDays } from "lucide-react";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { renderGoalCategoryIcon } from "@/features/goals/components/goal-visuals";

interface GoalCardProps {
  data: GoalCardData;
  isActive?: boolean;
  onClick: () => void;
}

export function GoalCard({ data, isActive = false, onClick }: GoalCardProps): JSX.Element {
  const { goal, nextPendingTask, progress } = data;

  return (
    <button
      className={isActive ? "goal-card goal-card--active" : "goal-card"}
      onClick={onClick}
      type="button"
    >
      <div className="goal-card__top">
        <div className="goal-card__category">
          <span className="goal-card__category-icon">{renderGoalCategoryIcon(goal.category)}</span>
          <span className="goal-card__category-pill">{goal.category}</span>
        </div>
        <span className="goal-card__status">{goal.status}</span>
      </div>

      <div className="goal-card__content">
        <h3 className="goal-card__title">{goal.title}</h3>
        <p className="goal-card__description">
          {goal.description || "Task-led progress keeps this goal grounded in real steps."}
        </p>
      </div>

      <GoalProgress
        completed={progress.completed}
        percent={progress.percentage}
        summaryText={progress.label}
        total={progress.total}
      />

      <div className="goal-card__footer">
        <div className="goal-card__footer-copy">
          {nextPendingTask ? (
            <span className="goal-card__next-task">Next: {nextPendingTask.title}</span>
          ) : (
            <span className="goal-card__next-task">No steps yet</span>
          )}
        </div>

        {goal.deadline ? (
          <span className="goal-card__deadline">
            <CalendarDays size={15} />
            {goal.deadline}
          </span>
        ) : null}
      </div>
    </button>
  );
}
