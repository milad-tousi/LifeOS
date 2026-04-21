import { Card } from "@/components/common/Card";

export function HabitTracker(): JSX.Element {
  return (
    <Card title="Habit tracker" subtitle="Reserved for quick logging interactions">
      <p className="muted" style={{ margin: 0 }}>
        Future check-ins can write compact log entries into the `habitLogs` table.
      </p>
    </Card>
  );
}

