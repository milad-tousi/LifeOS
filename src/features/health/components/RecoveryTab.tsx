import { Card } from "@/components/common/Card";
import { ReadinessBreakdownPanel } from "@/features/health/components/ReadinessBreakdownPanel";
import { RecoveryCheckInForm } from "@/features/health/components/RecoveryCheckInForm";
import { RecoveryOverviewCards } from "@/features/health/components/RecoveryOverviewCards";
import { RecoveryRecentCheckIns } from "@/features/health/components/RecoveryRecentCheckIns";
import { RecoveryWarningsPanel } from "@/features/health/components/RecoveryWarningsPanel";
import {
  HealthLog,
  RecoveryCheckIn,
  RecoveryCheckInInput,
  RecoveryOverviewStats,
  WorkoutLog,
} from "@/features/health/types/health.types";

interface RecoveryTabProps {
  checkIns: RecoveryCheckIn[];
  healthLogs: HealthLog[];
  onDeleteCheckIn: (id: string) => void;
  onSaveTodayCheckIn: (input: RecoveryCheckInInput) => void;
  overviewStats: RecoveryOverviewStats;
  workoutLogs: WorkoutLog[];
}

export function RecoveryTab({
  checkIns,
  healthLogs,
  onDeleteCheckIn,
  onSaveTodayCheckIn,
  overviewStats,
  workoutLogs,
}: RecoveryTabProps): JSX.Element {
  return (
    <div className="health-tab-panel">
      <Card
        title="Recovery"
        subtitle="Estimate readiness and plan training intensity using local wellness signals."
      />

      <RecoveryOverviewCards stats={overviewStats} />

      <div className="recovery-layout">
        <RecoveryCheckInForm
          onSave={onSaveTodayCheckIn}
          todayCheckIn={overviewStats.todayCheckIn}
        />
        <div className="recovery-layout__side">
          <ReadinessBreakdownPanel readiness={overviewStats.readiness} />
          <RecoveryWarningsPanel readiness={overviewStats.readiness} />
          <RecoveryRecentCheckIns
            checkIns={checkIns}
            healthLogs={healthLogs}
            onDelete={onDeleteCheckIn}
            workoutLogs={workoutLogs}
          />
        </div>
      </div>
    </div>
  );
}
