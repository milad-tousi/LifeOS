import { Button } from "@/components/common/Button";
import { DashboardEmptyState } from "@/features/dashboard/components/EmptyState";
import { TodayPlan } from "@/features/dashboard/types/dashboard.types";
import { useI18n } from "@/i18n";

interface TodayPlanPanelProps {
  onCompleteHabit: (habitId: string, periodKey: string, completed: boolean) => void;
  onNavigate: (path: string) => void;
  onToggleTask: (taskId: string) => void;
  plan: TodayPlan;
}

export function TodayPlanPanel({
  onCompleteHabit,
  onNavigate,
  onToggleTask,
  plan,
}: TodayPlanPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="dashboard-today-grid">
      <TodaySection title={t("dashboard.tasksDueToday")}>
        {plan.tasksDueToday.length > 0 ? (
          plan.tasksDueToday.map((task) => (
            <article className="dashboard-today-item" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.priority} {t("common.priority")} • {task.status}</span>
              </div>
              <Button onClick={() => onToggleTask(task.id)} type="button" variant="secondary">
                {t("dashboard.complete")}
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title={t("dashboard.noTasksDueToday")} description={t("dashboard.noTasksDueTodayDescription")} />
        )}
      </TodaySection>

      <TodaySection title={t("dashboard.overdueTasks")}>
        {plan.overdueTasks.length > 0 ? (
          plan.overdueTasks.map((task) => (
            <article className="dashboard-today-item dashboard-today-item--warning" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.dueDate ?? t("tasks.noDate")} • {task.priority} {t("common.priority")}</span>
              </div>
              <Button onClick={() => onNavigate("/tasks")} type="button" variant="secondary">
                {t("dashboard.view")}
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title={t("dashboard.noOverdueTasks")} description={t("dashboard.noOverdueTasksDescription")} />
        )}
      </TodaySection>

      <TodaySection title={t("dashboard.habitsScheduledToday")}>
        {plan.habitsScheduledToday.length > 0 ? (
          plan.habitsScheduledToday.map((habit) => (
            <article className="dashboard-today-item" key={habit.id}>
              <div>
                <strong>{habit.title}</strong>
                <span>{habit.completed ? t("tasks.completed") : t("dashboard.openForToday")}</span>
              </div>
              <Button
                onClick={() => onCompleteHabit(habit.id, habit.periodKey, habit.completed)}
                type="button"
                variant={habit.completed ? "ghost" : "secondary"}
              >
                {habit.completed ? t("dashboard.undo") : t("dashboard.complete")}
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title={t("dashboard.noHabitsScheduled")} description={t("dashboard.noHabitsScheduledDescription")} />
        )}
      </TodaySection>

      <TodaySection title={t("dashboard.goalsNeedingProgress")}>
        {plan.goalsNeedingProgress.length > 0 ? (
          plan.goalsNeedingProgress.map((goal) => (
            <article className="dashboard-today-item" key={goal.id}>
              <div>
                <strong>{goal.title}</strong>
                <span>{goal.progress}% {t("goals.progress")} • {goal.status}</span>
              </div>
              <Button onClick={() => onNavigate(`/goals/${goal.id}`)} type="button" variant="secondary">
                {t("dashboard.viewGoal")}
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title={t("dashboard.noGoalsNeedAttention")} description={t("dashboard.noGoalsNeedAttentionDescription")} />
        )}
      </TodaySection>

      <section className="dashboard-card dashboard-review-reminder">
        <div>
          <h2>{t("reviews.dailyReview")}</h2>
          <p>{plan.dailyReviewCompleted ? t("dashboard.dailyReviewComplete") : t("dashboard.captureToday")}</p>
        </div>
        {!plan.dailyReviewCompleted ? (
          <Button onClick={() => onNavigate("/reviews")} type="button">
            {t("dashboard.writeDailyReview")}
          </Button>
        ) : null}
      </section>
    </div>
  );
}

function TodaySection({
  children,
  title,
}: {
  children: JSX.Element | JSX.Element[];
  title: string;
}): JSX.Element {
  return (
    <section className="dashboard-card dashboard-today-section">
      <div className="dashboard-card__header">
        <div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="dashboard-today-list">{children}</div>
    </section>
  );
}
