import { createId } from "@/lib/id";
import { HealthLog } from "@/domains/health/types";

export function createHealthLogModel(date: string): HealthLog {
  const timestamp = Date.now();

  return {
    id: createId(),
    date,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
