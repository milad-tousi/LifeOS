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
  const { goal, habitProgress, linkedHabits, nextPendingTask, overallProgress, progress } = data;

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

      <div className="goal-card__habit-progress">
        <div className="goal-card__habit-progress-header">
          <span>Habit Progress</span>
          <strong>{habitProgress.completionRate}%</strong>
        </div>
        <div className="goal-card__habit-progress-track">
          <span style={{ width: `${habitProgress.completionRate}%` }} />
        </div>
        <p>
          {habitProgress.linkedHabitCount} linked habits ·{" "}
          {Math.round(habitProgress.completedScheduledDays)} of{" "}
          {habitProgress.totalScheduledDays} scheduled days
        </p>
        {linkedHabits.length > 0 ? (
          <div className="goal-card__linked-habits">
            {linkedHabits.slice(0, 3).map((habit) => (
              <span key={habit.id}>{habit.title}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="goal-card__overall-progress">
        <span>Overall Progress</span>
        <strong>{overallProgress}%</strong>
      </div>

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
