import { createId } from "@/lib/id";
import { Goal } from "@/domains/goals/types";

export function createGoalModel(title: string): Goal {
  return {
    id: createId(),
    title,
    progress: 0,
    target: 100,
    status: "active",
  };
}
