import { Dexie } from "dexie";
import { DB_VERSION_1, schemaV1 } from "@/db/schema";

export function registerDatabaseMigrations(database: Dexie): void {
  database.version(DB_VERSION_1).stores(schemaV1);

  // Future schema upgrades should be registered here:
  // database.version(2).stores(schemaV2).upgrade(async (transaction) => {
  //   // migration logic
  // });
}
