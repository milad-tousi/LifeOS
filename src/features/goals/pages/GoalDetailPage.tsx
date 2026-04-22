import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { getGoalTaskStats } from "@/domains/goals/goal-progress";
import { getGoalProgressPercentFromMode } from "@/domains/goals/goal.utils";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";
import { EditGoalModal } from "@/features/goals/components/EditGoalModal";
import { GoalHeader } from "@/features/goals/components/GoalHeader";
import { GoalProgress } from "@/features/goals/components/GoalProgress";
import { GoalTaskList } from "@/features/goals/components/GoalTaskList";
import { useGoalDetail } from "@/features/goals/hooks/useGoalDetail";
import { TaskModal } from "@/features/tasks/components/AddTaskModal";

const TASK_ROW_TRANSITION_MS = 220;

export function GoalDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { goalId } = useParams<{ goalId: string }>();
  const { goal, linkedTasks, loading } = useGoalDetail(goalId);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [goalState, setGoalState] = useState<Goal | null>(null);
  const [taskListState, setTaskListState] = useState<Task[]>([]);
  const [recentTaskId, setRecentTaskId] = useState<string | null>(null);
  const [recentTaskTone, setRecentTaskTone] = useState<"created" | "updated" | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    setGoalState(goal ?? null);
  }, [goal]);

  useEffect(() => {
    setTaskListState(linkedTasks);
  }, [linkedTasks]);

  useEffect(() => {
    if (!recentTaskId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentTaskId(null);
      setRecentTaskTone(null);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [recentTaskId]);

  const stats = useMemo(() => getGoalTaskStats(taskListState), [taskListState]);
  const displayGoal = useMemo(() => {
    if (!goalState) {
      return goalState;
    }

    if (goalState.status === "paused" || goalState.status === "archived") {
      return goalState;
    }

    return {
      ...goalState,
      status: stats.total > 0 && stats.completed === stats.total ? "completed" : "active",
    };
  }, [goalState, stats.completed, stats.total]);
  const progressPercent = useMemo(() => {
    if (!displayGoal) {
      return 0;
    }

    return getGoalProgressPercentFromMode(displayGoal) ?? stats.progressPercent;
  }, [displayGoal, stats.progressPercent]);
  const progressSummaryText = useMemo(() => {
    if (!displayGoal) {
      return "No steps yet";
    }

    if (displayGoal.progressType === "manual") {
      return displayGoal.manualProgress !== null && displayGoal.manualProgress !== undefined
        ? `Manual progress set to ${displayGoal.manualProgress}%`
        : "Manual progress has not been set yet";
    }

    if (displayGoal.progressType === "target") {
      if (displayGoal.targetType === "binary") {
        return (displayGoal.currentValue ?? 0) > 0
          ? "Binary target marked complete"
          : "Binary target not completed yet";
      }

      if (
        displayGoal.targetValue !== null &&
        displayGoal.targetValue !== undefined &&
        displayGoal.targetType !== "none"
      ) {
        return `${displayGoal.currentValue ?? 0} of ${displayGoal.targetValue} target units reached`;
      }
    }

    return stats.total > 0 ? `${stats.completed} of ${stats.total} tasks completed` : "No steps yet";
  }, [displayGoal, stats.completed, stats.total]);

  function replaceTaskInState(task: Task): void {
    setTaskListState((currentTasks) => {
      const hasExistingTask = currentTasks.some((currentTask) => currentTask.id === task.id);

      if (!hasExistingTask) {
        return [...currentTasks, task].sort((leftTask, rightTask) => leftTask.createdAt - rightTask.createdAt);
      }

      return currentTasks.map((currentTask) =>
        currentTask.id === task.id ? task : currentTask,
      );
    });
  }

  if (loading) {
    return <p className="text-muted">Loading goal...</p>;
  }

  if (!displayGoal) {
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
        <GoalHeader goal={displayGoal} />
        <GoalProgress
          completed={stats.completed}
          large
          percent={progressPercent}
          summaryText={progressSummaryText}
          total={stats.total}
        />
      </Card>

      <Card title="Steps" subtitle="Progress updates instantly as linked tasks change">
        {taskListState.length === 0 ? (
          <EmptyState
            actionLabel="Add your first task"
            description="No steps yet. Add tasks to start making progress."
            onAction={() => setIsAddTaskModalOpen(true)}
            title="No steps yet"
          />
        ) : (
          <GoalTaskList
            deletingTaskId={deletingTaskId}
            onDeleteTask={setTaskPendingDelete}
            onEditTask={setTaskBeingEdited}
            onToggleTask={(task) => {
              const nextStatus = task.status === "done" ? "todo" : "done";
              const updatedTask: Task = {
                ...task,
                status: nextStatus,
                completedAt: nextStatus === "done" ? Date.now() : undefined,
                updatedAt: Date.now(),
              };

              replaceTaskInState(updatedTask);

              void tasksRepository.toggleTaskComplete(task.id).catch(() => {
                replaceTaskInState(task);
              });
            }}
            recentTaskId={recentTaskId}
            recentTaskTone={recentTaskTone}
            tasks={taskListState}
          />
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
            onClick={() => void goalsRepository.pause(displayGoal.id)}
            type="button"
            variant="secondary"
          >
            Pause
          </Button>
          <Button
            onClick={() => void goalsRepository.archive(displayGoal.id)}
            type="button"
            variant="ghost"
          >
            Archive
          </Button>
        </div>
      </Card>

      <TaskModal
        goalId={displayGoal.id}
        goalTitle={displayGoal.title}
        isOpen={isAddTaskModalOpen}
        onSaved={(savedTask) => {
          replaceTaskInState(savedTask);
          setRecentTaskId(savedTask.id);
          setRecentTaskTone("created");
        }}
        onClose={() => setIsAddTaskModalOpen(false)}
      />
      <TaskModal
        goalId={displayGoal.id}
        goalTitle={displayGoal.title}
        initialTask={taskBeingEdited}
        isOpen={Boolean(taskBeingEdited)}
        mode="edit"
        onSaved={(savedTask) => {
          replaceTaskInState(savedTask);
          setTaskBeingEdited(savedTask);
          setRecentTaskId(savedTask.id);
          setRecentTaskTone("updated");
        }}
        onClose={() => setTaskBeingEdited(null)}
      />
      <EditGoalModal
        goal={displayGoal}
        isOpen={isEditGoalModalOpen}
        onSaved={setGoalState}
        onClose={() => setIsEditGoalModalOpen(false)}
      />
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        description="This action cannot be undone."
        isConfirming={isDeletingTask}
        isOpen={Boolean(taskPendingDelete)}
        onCancel={() => {
          if (!isDeletingTask) {
            setTaskPendingDelete(null);
          }
        }}
        onConfirm={() => {
          if (!taskPendingDelete) {
            return;
          }

          const deletingTask = taskPendingDelete;
          const previousTasks = taskListState;

          setTaskPendingDelete(null);
          setIsDeletingTask(true);
          setDeletingTaskId(deletingTask.id);

          window.setTimeout(() => {
            setTaskListState((currentTasks) =>
              currentTasks.filter((task) => task.id !== deletingTask.id),
            );

            void tasksRepository
              .remove(deletingTask.id)
              .catch(() => {
                setTaskListState(previousTasks);
              })
              .finally(() => {
                setDeletingTaskId(null);
                setIsDeletingTask(false);
              });
          }, TASK_ROW_TRANSITION_MS);
        }}
        title="Delete this task?"
        tone="danger"
      />
    </div>
  );
}
