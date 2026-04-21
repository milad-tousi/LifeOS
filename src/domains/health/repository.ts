import { db } from "@/db/dexie";
import { HealthLog } from "@/domains/health/types";

export const healthRepository = {
  async getAll(): Promise<HealthLog[]> {
    return db.healthLogs.orderBy("date").reverse().toArray();
  },
};
