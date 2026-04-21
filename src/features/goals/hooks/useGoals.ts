import { useLiveQuery } from "dexie-react-hooks";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal } from "@/domains/goals/types";

export interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
}

export function useGoals(): UseGoalsResult {
  const goals = useLiveQuery(() => goalsRepository.getAll(), []);

  return {
    goals: goals ?? [],
    loading: goals === undefined,
  };
}
