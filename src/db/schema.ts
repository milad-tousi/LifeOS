export const DB_NAME = "lifeos";
export const DB_VERSION_1 = 1;

export const TABLES = {
  tasks: "tasks",
  habits: "habits",
  habitLogs: "habitLogs",
  goals: "goals",
  expenses: "expenses",
  healthLogs: "healthLogs",
  dailyReviews: "dailyReviews",
  settings: "settings",
} as const;

export const schemaV1 = {
  [TABLES.tasks]: "id, status, scheduledDate, createdAt, [scheduledDate+status]",
  [TABLES.habits]: "id, frequency, isArchived, createdAt",
  [TABLES.habitLogs]: "id, habitId, date, [habitId+date], [date+habitId]",
  [TABLES.goals]: "id, status, deadline, createdAt, [status+deadline]",
  [TABLES.expenses]: "id, category, expenseDate, createdAt, [expenseDate+category]",
  [TABLES.healthLogs]: "id, date, createdAt",
  [TABLES.dailyReviews]: "id, date, createdAt",
  [TABLES.settings]: "key",
} as const;
