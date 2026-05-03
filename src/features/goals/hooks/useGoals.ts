import { useLiveQuery } from "dexie-react-hooks";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal } from "@/domains/goals/types";
import { computeGoalProgress, GoalProgressSnapshot } from "@/domains/goals/goal-progress";
import { tasksRepository } from "@/domains/tasks/repository";
import { Task } from "@/domains/tasks/types";
import { Habit } from "@/domains/habits/types";
import { getHabitLogs, getHabits } from "@/features/habits/services/habits.storage";
import {
  calculateGoalHabitProgress,
  GoalHabitProgress,
} from "@/features/habits/utils/habit-goal-progress.utils";
import { endOfMonth, startOfMonth } from "@/features/habits/utils/habit.utils";

export interface GoalCardData {
  goal: Goal;
  linkedTasks: Task[];
  linkedHabits: Habit[];
  progress: GoalProgressSnapshot;
  habitProgress: GoalHabitProgress;
  overallProgress: number;
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
    const habits = getHabits();
    const habitLogs = getHabitLogs();
    const monthRange = {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    };

    return goalRecords.map((goal) => {
      const allGoalTasks = tasks.filter((task) => task.goalId === goal.id);
      const linkedTasks = allGoalTasks.filter((task) => !task.parentTaskId);
      const progress = computeGoalProgress(goal, allGoalTasks);
      const habitProgress = calculateGoalHabitProgress(goal.id, habits, habitLogs, monthRange);
      const hasExistingProgress = progress.total > 0 || progress.percentage > 0;
      const hasHabitProgress = habitProgress.totalScheduledDays > 0;
      const overallProgress =
        hasExistingProgress && hasHabitProgress
          ? Math.round((progress.percentage + habitProgress.completionRate) / 2)
          : hasHabitProgress
            ? habitProgress.completionRate
            : progress.percentage;
      const nextPendingTask = linkedTasks.find(
        (task) => task.status === "todo" || task.status === "in_progress",
      );

      return {
        goal,
        habitProgress,
        linkedHabits: habitProgress.linkedHabits,
        linkedTasks,
        overallProgress,
        progress,
        nextPendingTask,
      };
    });
  }, []);

  return {
    goals: goals ?? [],
    loading: goals === undefined,
  };
}
