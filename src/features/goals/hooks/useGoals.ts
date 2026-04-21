import { useLiveQuery } from "dexie-react-hooks";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal } from "@/domains/goals/types";
import { getGoalTaskStats, GoalTaskStats } from "@/domains/goals/goal-progress";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";

export interface GoalCardData {
  goal: Goal;
  linkedTasks: Task[];
  stats: GoalTaskStats;
  nextPendingTask?: Task;
}

export interface UseGoalsResult {
  goals: GoalCardData[];
  loading: boolean;
}

export function useGoals(): UseGoalsResult {
  const goals = useLiveQuery(async () => {
    const [goalRecords, tasks] = await Promise.all([
      goalsRepository.getAll(),
      tasksRepository.getAll(),
    ]);

    return goalRecords.map((goal) => {
      const linkedTasks = tasks.filter((task) => task.goalId === goal.id);
      const stats = getGoalTaskStats(linkedTasks);
      const nextPendingTask = linkedTasks.find((task) => task.status === "pending");

      return {
        goal,
        linkedTasks,
        stats,
        nextPendingTask,
      };
    });
  }, []);

  return {
    goals: goals ?? [],
    loading: goals === undefined,
  };
}
