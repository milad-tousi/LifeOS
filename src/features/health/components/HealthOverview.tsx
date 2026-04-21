import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { HealthLog } from "@/domains/health/types";

interface HealthOverviewProps {
  logs: HealthLog[];
}

export function HealthOverview({ logs }: HealthOverviewProps): JSX.Element {
  if (logs.length === 0) {
    return (
      <EmptyState
        title="No health logs yet"
        description="Health entries will be stored locally when this module is implemented."
      />
    );
  }

  return (
    <Card title="Health logs">
      <div className="page-list">
        {logs.map((log) => (
          <div key={log.id} className="page-list__item">
            <strong>{log.metric}</strong>
            <span className="text-muted">{log.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
