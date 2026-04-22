import { Dexie } from "dexie";
import {
  DB_VERSION_1,
  DB_VERSION_2,
  DB_VERSION_3,
  DB_VERSION_4,
  DB_VERSION_5,
  DB_VERSION_6,
  DB_VERSION_7,
  DB_VERSION_8,
  schemaV1,
  schemaV2,
  schemaV3,
  schemaV4,
  schemaV5,
  schemaV6,
  schemaV7,
  schemaV8,
} from "@/db/schema";

export function registerDatabaseMigrations(database: Dexie): void {
  database.version(DB_VERSION_1).stores(schemaV1);
  database.version(DB_VERSION_2).stores(schemaV2).upgrade(() => {
    // Version 2 introduces local auth users without transforming existing tables.
  });
  database.version(DB_VERSION_3).stores(schemaV3).upgrade(() => {
    // Version 3 introduces onboarding data tables without transforming existing records.
  });
  database.version(DB_VERSION_4).stores(schemaV4).upgrade(() => {
    // Version 4 switches local auth identity to email and expands onboarding state flags.
  });
  database.version(DB_VERSION_5).stores(schemaV5).upgrade(() => {
    // Version 5 adds goal-linked task indexes and richer goal categorization fields.
  });
  database.version(DB_VERSION_6).stores(schemaV6).upgrade(() => {
    // Version 6 introduces board columns and persisted task board placement.
  });
  database.version(DB_VERSION_7).stores(schemaV7).upgrade(() => {
    // Version 7 introduces persisted calendar events for the planner view.
  });
  database.version(DB_VERSION_8).stores(schemaV8).upgrade((transaction) => {
    return transaction
      .table("calendarEvents")
      .toCollection()
      .modify((event: Record<string, unknown>) => {
        const startDate =
          typeof event.startDate === "string"
            ? event.startDate
            : typeof event.date === "string"
              ? event.date
              : undefined;
        const startTime =
          typeof event.startTime === "string"
            ? event.startTime
            : typeof event.time === "string"
              ? event.time
              : null;

        event.startDate = startDate;
        event.endDate = typeof event.endDate === "string" ? event.endDate : null;
        event.startTime = startTime;
        event.endTime = typeof event.endTime === "string" ? event.endTime : null;
        event.recurrence =
          typeof event.recurrence === "object" && event.recurrence !== null ? event.recurrence : null;
      });
  });

  // Future schema upgrades should be registered here.
}
