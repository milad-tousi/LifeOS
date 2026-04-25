import { Card } from "@/components/common/Card";
import { BodyMetricForm } from "@/features/health/components/BodyMetricForm";
import { BodyMetricOverviewCards } from "@/features/health/components/BodyMetricOverviewCards";
import { BodyMetricRecentLogs } from "@/features/health/components/BodyMetricRecentLogs";
import { BodyMetricTrendPanel } from "@/features/health/components/BodyMetricTrendPanel";
import { getTodayDateKey } from "@/features/health/services/healthCalculations";
import {
  BodyMetricLog,
  BodyMetricLogInput,
  BodyMetricOverviewStats,
} from "@/features/health/types/health.types";

interface BodyMetricsTabProps {
  logs: BodyMetricLog[];
  onDeleteLog: (id: string) => void;
  onSaveTodayLog: (input: BodyMetricLogInput) => void;
  overviewStats: BodyMetricOverviewStats;
}

export function BodyMetricsTab({
  logs,
  onDeleteLog,
  onSaveTodayLog,
  overviewStats,
}: BodyMetricsTabProps): JSX.Element {
  const todayLog = logs.find((log) => log.date === getTodayDateKey()) ?? null;

  return (
    <div className="health-tab-panel">
      <Card
        title="Body Metrics"
        subtitle="Track weight, body composition, and body measurements over time."
      />

      <BodyMetricOverviewCards stats={overviewStats} />

      <div className="body-metrics-layout">
        <BodyMetricForm onSave={onSaveTodayLog} todayLog={todayLog} />
        <div className="body-metrics-layout__side">
          <BodyMetricTrendPanel logs={logs} stats={overviewStats} />
          <BodyMetricRecentLogs logs={logs} onDelete={onDeleteLog} />
        </div>
      </div>
    </div>
  );
}
