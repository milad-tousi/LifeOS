import { useLiveQuery } from "dexie-react-hooks";
import { settingsRepository } from "@/domains/settings/repository";
import { AppSetting } from "@/domains/settings/types";

export interface UseSettingsResult {
  settings: AppSetting[];
  loading: boolean;
}

export function useSettings(): UseSettingsResult {
  const settings = useLiveQuery(() => settingsRepository.getAll(), []);

  return {
    settings: settings ?? [],
    loading: settings === undefined,
  };
}
