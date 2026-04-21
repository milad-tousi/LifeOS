import { db } from "@/db/dexie";
import { AppSetting } from "@/domains/settings/types";

export const settingsRepository = {
  async getAll(): Promise<AppSetting[]> {
    return db.settings.orderBy("updatedAt").reverse().toArray();
  },
  async upsert(setting: AppSetting): Promise<string> {
    await db.settings.put({
      ...setting,
      updatedAt: Date.now(),
    });
    return setting.key;
  },
};
