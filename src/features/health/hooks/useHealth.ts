import { useLiveQuery } from "dexie-react-hooks";
import { healthRepository } from "@/domains/health/repository";
import { HealthLog } from "@/domains/health/types";

export interface UseHealthResult {
  logs: HealthLog[];
  loading: boolean;
}

export function useHealth(): UseHealthResult {
  const logs = useLiveQuery(() => healthRepository.getAll(), []);

  return {
    logs: logs ?? [],
    loading: logs === undefined,
  };
}
