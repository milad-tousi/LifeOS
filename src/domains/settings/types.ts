import { TimestampMs } from "@/types/shared.types";

export interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: TimestampMs;
}
