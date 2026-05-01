import { Button } from "@/components/common/Button";
import { DashboardEmptyState } from "@/features/dashboard/components/EmptyState";
import { TodayPlan } from "@/features/dashboard/types/dashboard.types";

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
  return (
    <div className="dashboard-today-grid">
      <TodaySection title="Tasks Due Today">
        {plan.tasksDueToday.length > 0 ? (
          plan.tasksDueToday.map((task) => (
            <article className="dashboard-today-item" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.priority} priority • {task.status}</span>
              </div>
              <Button onClick={() => onToggleTask(task.id)} type="button" variant="secondary">
                Complete
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title="No tasks due today" description="Nothing is scheduled for today." />
        )}
      </TodaySection>

      <TodaySection title="Overdue Tasks">
        {plan.overdueTasks.length > 0 ? (
          plan.overdueTasks.map((task) => (
            <article className="dashboard-today-item dashboard-today-item--warning" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.dueDate ?? "No due date"} • {task.priority} priority</span>
              </div>
              <Button onClick={() => onNavigate("/tasks")} type="button" variant="secondary">
                View
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title="No overdue tasks" description="You are clear of overdue work." />
        )}
      </TodaySection>

      <TodaySection title="Habits Scheduled Today">
        {plan.habitsScheduledToday.length > 0 ? (
          plan.habitsScheduledToday.map((habit) => (
            <article className="dashboard-today-item" key={habit.id}>
              <div>
                <strong>{habit.title}</strong>
                <span>{habit.completed ? "Completed" : "Open for today"}</span>
              </div>
              <Button
                onClick={() => onCompleteHabit(habit.id, habit.periodKey, habit.completed)}
                type="button"
                variant={habit.completed ? "ghost" : "secondary"}
              >
                {habit.completed ? "Undo" : "Complete"}
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title="No habits scheduled" description="No active habit is due today." />
        )}
      </TodaySection>

      <TodaySection title="Goals Needing Progress">
        {plan.goalsNeedingProgress.length > 0 ? (
          plan.goalsNeedingProgress.map((goal) => (
            <article className="dashboard-today-item" key={goal.id}>
              <div>
                <strong>{goal.title}</strong>
                <span>{goal.progress}% progress • {goal.status}</span>
              </div>
              <Button onClick={() => onNavigate(`/goals/${goal.id}`)} type="button" variant="secondary">
                View Goal
              </Button>
            </article>
          ))
        ) : (
          <DashboardEmptyState title="No goals need attention" description="Active goals are moving." />
        )}
      </TodaySection>

      <section className="dashboard-card dashboard-review-reminder">
        <div>
          <h2>Daily Review</h2>
          <p>{plan.dailyReviewCompleted ? "Daily review completed" : "Capture today before it fades."}</p>
        </div>
        {!plan.dailyReviewCompleted ? (
          <Button onClick={() => onNavigate("/reviews")} type="button">
            Write Daily Review
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
