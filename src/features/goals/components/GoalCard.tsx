import { CalendarDays } from "lucide-react";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { renderGoalCategoryIcon } from "@/features/goals/components/goal-visuals";
import { useI18n } from "@/i18n";

interface GoalCardProps {
  data: GoalCardData;
  isActive?: boolean;
  onClick: () => void;
}

export function GoalCard({ data, isActive = false, onClick }: GoalCardProps): JSX.Element {
  const { t } = useI18n();
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
          {goal.description || t("goals.defaultDescription")}
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
          <span>{t("goals.habitProgress")}</span>
          <strong>{habitProgress.completionRate}%</strong>
        </div>
        <div className="goal-card__habit-progress-track">
          <span style={{ width: `${habitProgress.completionRate}%` }} />
        </div>
        <p>
          {habitProgress.linkedHabitCount} {t("goals.linkedHabits")} ·{" "}
          {Math.round(habitProgress.completedScheduledDays)} of{" "}
          {habitProgress.totalScheduledDays} {t("goals.scheduledDays")}
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
        <span>{t("goals.overallProgress")}</span>
        <strong>{overallProgress}%</strong>
      </div>

      <div className="goal-card__footer">
        <div className="goal-card__footer-copy">
          {nextPendingTask ? (
            <span className="goal-card__next-task">{t("goals.next")}: {nextPendingTask.title}</span>
          ) : (
            <span className="goal-card__next-task">{t("goals.noStepsYet")}</span>
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
