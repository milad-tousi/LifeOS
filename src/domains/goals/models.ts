import { createId } from "@/lib/id";
import { normalizeGoalInput } from "@/domains/goals/goal.utils";
import { CreateGoalInput, Goal } from "@/domains/goals/types";

export function createGoalModel(input: CreateGoalInput): Goal {
  const timestamp = Date.now();
  const normalizedInput = normalizeGoalInput(input);

  return {
    id: createId(),
    title: normalizedInput.title,
    description: normalizedInput.description,
    category: normalizedInput.category,
    status: "active",
    priority: normalizedInput.priority,
    pace: normalizedInput.pace,
    targetType: normalizedInput.targetType ?? "none",
    targetValue: normalizedInput.targetValue ?? null,
    currentValue: normalizedInput.currentValue ?? null,
    progressType: normalizedInput.progressType ?? "tasks",
    manualProgress: normalizedInput.manualProgress ?? null,
    notes: normalizedInput.notes ?? "",
    deadline: normalizedInput.deadline,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
