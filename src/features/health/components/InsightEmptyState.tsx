import { EmptyState } from "@/components/common/EmptyState";

export function InsightEmptyState(): JSX.Element {
  return (
    <EmptyState
      title="No strong insights yet"
      description="Add a few health logs, workouts, meals, and recovery check-ins to reveal useful local patterns."
    />
  );
}
