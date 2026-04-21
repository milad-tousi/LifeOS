import { createId } from "@/lib/id";
import { CreateGoalInput, Goal } from "@/domains/goals/types";

export function createGoalModel(input: CreateGoalInput): Goal {
  const timestamp = Date.now();

  return {
    id: createId(),
    title: input.title,
    description: input.description,
    category: input.category,
    status: "active",
    priority: input.priority,
    pace: input.pace,
    deadline: input.deadline,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
