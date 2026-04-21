export const DB_NAME = "lifeos";
export const DB_VERSION = 1;

export const dbSchema = {
  tasks: "id, status, dueDate, updatedAt",
  habits: "id, active, updatedAt",
  habitLogs: "id, habitId, loggedFor",
  goals: "id, status, targetDate, updatedAt",
  expenses: "id, category, occurredOn",
  healthLogs: "id, metric, loggedAt",
  dailyReviews: "id, reviewedOn, updatedAt",
  settings: "id, key, updatedAt",
} as const;

