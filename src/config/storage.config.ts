import { STORAGE_KEYS } from "@/constants/storage.keys";

export const storageConfig = {
  dbName: "lifeos",
  dbVersion: 1,
  localStorageKeys: STORAGE_KEYS,
  compactExportName: "lifeos-backup.json",
  maxLocalExportHistory: 3,
} as const;

