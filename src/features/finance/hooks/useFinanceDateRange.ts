import { useCallback, useMemo, useState } from "react";
import {
  getCurrentFinanceCycle,
  toDateString,
} from "@/features/finance/utils/financeCycle.utils";

export interface FinanceDateRange {
  /** YYYY-MM-DD inclusive lower bound */
  fromDate: string;
  /** YYYY-MM-DD inclusive upper bound */
  toDate: string;
}

export interface UseFinanceDateRangeResult {
  /** Active date range — either the current cycle or the user-supplied custom range */
  dateRange: FinanceDateRange;
  /** True when the user has overridden the default cycle range */
  isCustomRange: boolean;
  /** Apply a custom date range */
  setCustomRange: (range: FinanceDateRange) => void;
  /** Revert to the current finance cycle */
  resetRange: () => void;
  /** The cycle start day in use */
  cycleStartDay: number;
}

/**
 * Manages the active finance date range.
 *
 * By default the range equals the current finance cycle derived from
 * `cycleStartDay`. The user can override it with a custom range and
 * reset back at any time.
 */
export function useFinanceDateRange(
  cycleStartDay: number,
): UseFinanceDateRangeResult {
  const defaultRange = useMemo((): FinanceDateRange => {
    const cycle = getCurrentFinanceCycle(cycleStartDay);
    return {
      fromDate: toDateString(cycle.startDate),
      toDate: toDateString(cycle.endDate),
    };
  }, [cycleStartDay]);

  const [customRange, setCustomRangeState] = useState<FinanceDateRange | null>(null);

  const setCustomRange = useCallback((range: FinanceDateRange) => {
    setCustomRangeState(range);
  }, []);

  const resetRange = useCallback(() => {
    setCustomRangeState(null);
  }, []);

  return {
    dateRange: customRange ?? defaultRange,
    isCustomRange: customRange !== null,
    setCustomRange,
    resetRange,
    cycleStartDay,
  };
}
