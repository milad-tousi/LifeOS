import { CalendarDays } from "lucide-react";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { renderGoalCategoryIcon } from "@/features/goals/components/goal-visuals";
import { GoalCardData } from "@/features/goals/hooks/useGoals";
import {
  formatGoalProgressSummary,
  getGoalCategoryDisplayName,
  getGoalStatusDisplayName,
} from "@/features/goals/utils/goals.i18n";
import { useI18n } from "@/i18n";
import { formatAppDate, formatNumber } from "@/i18n/formatters";

interface GoalCardProps {
  data: GoalCardData;
  isActive?: boolean;
  onClick: () => void;
}

export function GoalCard({ data, isActive = false, onClick }: GoalCardProps): JSX.Element {
  const { direction, language, t } = useI18n();
  const { goal, habitProgress, linkedHabits, nextPendingTask, overallProgress, progress } = data;

  return (
    <button
      className={[
        "goal-card",
        isActive ? "goal-card--active" : "",
        direction === "rtl" ? "goal-card--rtl" : "",
      ].join(" ").trim()}
      onClick={onClick}
      type="button"
    >
      <div className="goal-card__top">
        <div className="goal-card__category">
          <span className="goal-card__category-icon">{renderGoalCategoryIcon(goal.category)}</span>
          <span className="goal-card__category-pill">{getGoalCategoryDisplayName(goal.category, t)}</span>
        </div>
        <span className="goal-card__status">{getGoalStatusDisplayName(goal.status, t)}</span>
      </div>

      <div className="goal-card__content">
        <h3 className="goal-card__title">{goal.title}</h3>
        <p className="goal-card__description">{goal.description || t("goals.defaultDescription")}</p>
      </div>

      <GoalProgress
        completed={progress.completed}
        percent={progress.percentage}
        summaryText={formatGoalProgressSummary(goal, progress, t, language)}
        total={progress.total}
        language={language}
      />

      <div className="goal-card__habit-progress">
        <div className="goal-card__habit-progress-header">
          <span>{t("goals.habitProgress")}</span>
          <strong>{formatNumber(habitProgress.completionRate, language)}%</strong>
        </div>
        <div className="goal-card__habit-progress-track">
          <span style={{ width: `${habitProgress.completionRate}%` }} />
        </div>
        <p>
          {t("goals.habitProgressSummary", {
            linkedHabitCount: formatNumber(habitProgress.linkedHabitCount, language),
            completedScheduledDays: formatNumber(
              Math.round(habitProgress.completedScheduledDays),
              language,
            ),
            totalScheduledDays: formatNumber(habitProgress.totalScheduledDays, language),
          })}
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
        <strong>{formatNumber(overallProgress, language)}%</strong>
      </div>

      <div className="goal-card__footer">
        <div className="goal-card__footer-copy">
          {nextPendingTask ? (
            <span className="goal-card__next-task">
              {t("goals.next")}: {nextPendingTask.title}
            </span>
          ) : (
            <span className="goal-card__next-task">{t("goals.noStepsYet")}</span>
          )}
        </div>

        {goal.deadline ? (
          <span className="goal-card__deadline">
            <CalendarDays size={15} />
            {formatGoalDeadline(goal.deadline, language)}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function formatGoalDeadline(value: string, language: "en" | "fa"): string {
  const safeDate = new Date(value);
  return Number.isNaN(safeDate.getTime()) ? value : formatAppDate(safeDate, language);
}
