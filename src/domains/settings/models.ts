import { createId } from "@/lib/id";
import { AppSetting } from "@/domains/settings/types";

export function createSettingModel(key: string, value: string): AppSetting {
  return {
    id: createId(),
    key,
    value,
    updatedAt: Date.now(),
  };
}
