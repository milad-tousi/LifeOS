import { Dexie } from "dexie";
import {
  DB_VERSION_1,
  DB_VERSION_2,
  DB_VERSION_3,
  DB_VERSION_4,
  DB_VERSION_5,
  DB_VERSION_6,
  schemaV1,
  schemaV2,
  schemaV3,
  schemaV4,
  schemaV5,
  schemaV6,
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

  // Future schema upgrades should be registered here.
}
