import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { goalsRepository } from "@/domains/goals/repository";
import { EditGoalModal } from "@/features/goals/components/EditGoalModal";
import { GoalHeader } from "@/features/goals/components/GoalHeader";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { GoalTaskList } from "@/features/goals/components/GoalTaskList";
import { useGoalDetail } from "@/features/goals/hooks/useGoalDetail";
import { AddTaskModal } from "@/features/tasks/components/AddTaskModal";

export function GoalDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const { goal, linkedTasks, loading, stats } = useGoalDetail(goalId);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);

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
            onAction={() => setIsAddTaskModalOpen(true)}
            title="No steps yet"
          />
        ) : (
          <GoalTaskList tasks={linkedTasks} />
        )}
      </Card>

      <Card title="Quick actions">
        <div className="goal-detail-page__actions">
          <Button onClick={() => setIsAddTaskModalOpen(true)} type="button">
            Add task
          </Button>
          <Button onClick={() => setIsEditGoalModalOpen(true)} type="button" variant="secondary">
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

      <AddTaskModal
        goalId={goal.id}
        goalTitle={goal.title}
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      />
      <EditGoalModal
        goal={goal}
        isOpen={isEditGoalModalOpen}
        onClose={() => setIsEditGoalModalOpen(false)}
      />
    </div>
  );
}
