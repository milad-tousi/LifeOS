import { AppSetting } from "@/domains/settings/types";

export function createSettingModel(key: string, value: unknown): AppSetting {
  return {
    key,
    value,
    updatedAt: Date.now(),
  };
}
