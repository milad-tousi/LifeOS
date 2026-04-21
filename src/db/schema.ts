export const DB_NAME = "lifeos";
export const DB_VERSION_1 = 1;
export const DB_VERSION_2 = 2;
export const DB_VERSION_3 = 3;
export const DB_VERSION_4 = 4;

export const TABLES = {
  authUsers: "authUsers",
  onboardingStates: "onboardingStates",
  userPreferences: "userPreferences",
  userProfiles: "userProfiles",
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

export const schemaV2 = {
  ...schemaV1,
  [TABLES.authUsers]: "id, &username, source, createdAt",
} as const;

export const schemaV3 = {
  ...schemaV2,
  [TABLES.userProfiles]: "id, updatedAt",
  [TABLES.userPreferences]: "id, updatedAt",
  [TABLES.onboardingStates]: "id, completed, currentStep, updatedAt",
} as const;

export const schemaV4 = {
  ...schemaV1,
  [TABLES.authUsers]: "id, &email, source, createdAt",
  [TABLES.userProfiles]: "id, updatedAt",
  [TABLES.userPreferences]: "id, updatedAt",
  [TABLES.onboardingStates]:
    "id, userId, started, completed, skipped, currentStep, updatedAt",
} as const;
