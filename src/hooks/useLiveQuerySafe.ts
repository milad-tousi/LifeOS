import { DependencyList } from "react";
import { useLiveQuery } from "dexie-react-hooks";

export function useLiveQuerySafe<T>(
  querier: () => Promise<T> | T,
  dependencies: DependencyList,
  fallback: T,
): T {
  return useLiveQuery(querier, [...dependencies], fallback);
}
