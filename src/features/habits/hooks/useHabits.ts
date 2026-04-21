import { useLiveQuery } from "dexie-react-hooks";
import { habitsRepository } from "@/domains/habits/repository";
import { Habit } from "@/domains/habits/types";

export interface UseHabitsResult {
  habits: Habit[];
  loading: boolean;
}

export function useHabits(): UseHabitsResult {
  const habits = useLiveQuery(() => habitsRepository.getAll(), []);

  return {
    habits: habits ?? [],
    loading: habits === undefined,
  };
}
