import { createId } from "@/lib/id";
import { Goal } from "@/domains/goals/types";

export function createGoalModel(title: string): Goal {
  const timestamp = Date.now();

  return {
    id: createId(),
    title,
    status: "active",
    currentValue: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
