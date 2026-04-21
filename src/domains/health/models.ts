import { createId } from "@/lib/id";
import { HealthLog } from "@/domains/health/types";

export function createHealthLogModel(metric: string): HealthLog {
  return {
    id: createId(),
    metric,
    value: 0,
    date: Date.now(),
  };
}
