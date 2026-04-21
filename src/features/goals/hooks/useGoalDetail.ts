import { useLiveQuery } from "dexie-react-hooks";
import { goalsRepository } from "@/domains/goals/repository";
import { getGoalTaskStats, GoalTaskStats } from "@/domains/goals/goal-progress";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

interface GoalDetailData {
  goal?: Goal;
  linkedTasks: Task[];
  stats: GoalTaskStats;
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
        stats: getGoalTaskStats([]),
      };
    }

    const [goal, linkedTasks] = await Promise.all([
      goalsRepository.getById(goalId),
      tasksRepository.getByGoalId(goalId),
    ]);

    return {
      goal,
      linkedTasks,
      stats: getGoalTaskStats(linkedTasks),
    };
  }, [goalId]);

  return {
    goal: goalDetail?.goal,
    linkedTasks: goalDetail?.linkedTasks ?? [],
    stats: goalDetail?.stats ?? getGoalTaskStats([]),
    loading: goalDetail === undefined,
  };
}
