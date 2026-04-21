import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { goalsRepository } from "@/domains/goals/repository";
import { tasksRepository } from "@/domains/tasks/repository";
import { GoalHeader } from "@/features/goals/components/GoalHeader";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { GoalTaskList } from "@/features/goals/components/GoalTaskList";
import { useGoalDetail } from "@/features/goals/hooks/useGoalDetail";

export function GoalDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const { goal, linkedTasks, loading, stats } = useGoalDetail(goalId);

  async function handleAddTask(): Promise<void> {
    if (!goalId) {
      return;
    }

    const taskTitle = window.prompt("Task title");

    if (!taskTitle || !taskTitle.trim()) {
      return;
    }

    await tasksRepository.addTaskToGoal(goalId, {
      title: taskTitle.trim(),
    });
  }

  async function handleEditGoal(): Promise<void> {
    if (!goal) {
      return;
    }

    const nextTitle = window.prompt("Goal title", goal.title);

    if (!nextTitle || !nextTitle.trim()) {
      return;
    }

    await goalsRepository.update(goal.id, { title: nextTitle.trim() });
  }

  if (loading) {
    return <p className="text-muted">Loading goal...</p>;
  }

  if (!goal) {
    return (
      <EmptyState
        actionLabel="Back to goals"
        description="This goal could not be found locally."
        onAction={() => navigate("/goals")}
        title="Goal not found"
      />
    );
  }

  return (
    <div className="goal-detail-page">
      <Button onClick={() => navigate("/goals")} type="button" variant="ghost">
        Back to goals
      </Button>

      <Card>
        <GoalHeader goal={goal} />
        <GoalProgress
          completed={stats.completed}
          large
          percent={stats.progressPercent}
          total={stats.total}
        />
      </Card>

      <Card title="Steps" subtitle="Progress updates instantly as linked tasks change">
        {linkedTasks.length === 0 ? (
          <EmptyState
            actionLabel="Add your first task"
            description="No steps yet. Add tasks to start making progress."
            onAction={() => void handleAddTask()}
            title="No steps yet"
          />
        ) : (
          <GoalTaskList tasks={linkedTasks} />
        )}
      </Card>

      <Card title="Quick actions">
        <div className="goal-detail-page__actions">
          <Button onClick={() => void handleAddTask()} type="button">
            Add task
          </Button>
          <Button onClick={() => void handleEditGoal()} type="button" variant="secondary">
            Edit goal
          </Button>
          <Button
            onClick={() => void goalsRepository.pause(goal.id)}
            type="button"
            variant="secondary"
          >
            Pause
          </Button>
          <Button
            onClick={() => void goalsRepository.archive(goal.id)}
            type="button"
            variant="ghost"
          >
            Archive
          </Button>
        </div>
      </Card>
    </div>
  );
}
