import { Card } from "@/components/common/Card";
import { DataCoveragePanel } from "@/features/health/components/DataCoveragePanel";
import { HealthInsightList } from "@/features/health/components/HealthInsightList";
import { InsightsOverviewCards } from "@/features/health/components/InsightsOverviewCards";
import { WeeklyFocusPanel } from "@/features/health/components/WeeklyFocusPanel";
import {
  calculateHealthDataCoverage,
  calculateInsightOverviewStats,
  generateHealthInsights,
  getWeeklyHealthFocus,
} from "@/features/health/services/healthInsights";
import {
  BodyMetricLog,
  HealthLog,
  NutritionMeal,
  RecoveryCheckIn,
  WorkoutLog,
} from "@/features/health/types/health.types";

interface InsightsTabProps {
  bodyMetricLogs: BodyMetricLog[];
  healthLogs: HealthLog[];
  nutritionMeals: NutritionMeal[];
  recoveryCheckIns: RecoveryCheckIn[];
  workoutLogs: WorkoutLog[];
}

export function InsightsTab({
  bodyMetricLogs,
  healthLogs,
  nutritionMeals,
  recoveryCheckIns,
  workoutLogs,
}: InsightsTabProps): JSX.Element {
  const params = {
    healthLogs,
    bodyMetricLogs,
    workoutLogs,
    nutritionMeals,
    recoveryCheckIns,
  };
  const coverage = calculateHealthDataCoverage(params);
  const insights = generateHealthInsights(params);
  const weeklyFocus = getWeeklyHealthFocus(params);
  const overviewStats = {
    ...calculateInsightOverviewStats(insights, coverage),
    weeklyFocus: weeklyFocus.title,
  };

  return (
    <div className="health-tab-panel">
      <Card
        title="Insights"
        subtitle="Find useful patterns across sleep, training, nutrition, recovery, and body metrics."
      />

      <InsightsOverviewCards stats={overviewStats} />

      <div className="insights-layout">
        <DataCoveragePanel coverage={coverage} />
        <WeeklyFocusPanel focus={weeklyFocus} />
      </div>

      <HealthInsightList insights={insights} />
    </div>
  );
}
