import { useLiveQuery } from "dexie-react-hooks";
import { goalsRepository } from "@/domains/goals/repository";
import { computeGoalProgress, GoalProgressSnapshot } from "@/domains/goals/goal-progress";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

interface GoalDetailData {
  goal?: Goal;
  linkedTasks: Task[];
  progress: GoalProgressSnapshot;
}

export interface UseGoalDetailResult extends GoalDetailData {
  loading: boolean;
}

export function useGoalDetail(goalId?: string): UseGoalDetailResult {
  const goalDetail = useLiveQuery<GoalDetailData>(async () => {
    if (!goalId) {
      return {
        goal: undefined,
        linkedTasks: [],
        progress: computeGoalProgress(
          {
            id: "",
            title: "",
            category: "lifestyle",
            status: "active",
            priority: "medium",
            pace: "balanced",
            progressType: "tasks",
            targetType: "none",
            targetValue: null,
            currentValue: null,
            manualProgress: null,
            notes: "",
            createdAt: 0,
            updatedAt: 0,
          },
          [],
        ),
      };
    }

    const [goal, linkedTasks] = await Promise.all([
      goalsRepository.getById(goalId),
      tasksRepository.getByGoalId(goalId),
    ]);

    return {
      goal,
      linkedTasks,
      progress: goal ? computeGoalProgress(goal, linkedTasks) : computeGoalProgress({
        id: "",
        title: "",
        category: "lifestyle",
        status: "active",
        priority: "medium",
        pace: "balanced",
        progressType: "tasks",
        targetType: "none",
        targetValue: null,
        currentValue: null,
        manualProgress: null,
        notes: "",
        createdAt: 0,
        updatedAt: 0,
      }, linkedTasks),
    };
  }, [goalId]);

  return {
    goal: goalDetail?.goal,
    linkedTasks: goalDetail?.linkedTasks ?? [],
    progress:
      goalDetail?.progress ??
      computeGoalProgress(
        {
          id: "",
          title: "",
          category: "lifestyle",
          status: "active",
          priority: "medium",
          pace: "balanced",
          progressType: "tasks",
          targetType: "none",
          targetValue: null,
          currentValue: null,
          manualProgress: null,
          notes: "",
          createdAt: 0,
          updatedAt: 0,
        },
        [],
      ),
    loading: goalDetail === undefined,
  };
}
