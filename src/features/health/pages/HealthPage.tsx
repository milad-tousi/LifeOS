import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { BodyMetricsTab } from "@/features/health/components/BodyMetricsTab";
import { HealthOverviewCards } from "@/features/health/components/HealthOverviewCards";
import { HealthQuickLogForm } from "@/features/health/components/HealthQuickLogForm";
import { HealthRecentLogs } from "@/features/health/components/HealthRecentLogs";
import { HealthTab, HealthTabs } from "@/features/health/components/HealthTabs";
import { InsightsTab } from "@/features/health/components/InsightsTab";
import { NutritionTab } from "@/features/health/components/NutritionTab";
import { RecoveryTab } from "@/features/health/components/RecoveryTab";
import { WorkoutTab } from "@/features/health/components/WorkoutTab";
import { useHealth } from "@/features/health/hooks/useHealth";
import { useState } from "react";

const COMING_SOON_COPY: Record<Exclude<HealthTab, "overview">, string> = {
  body: "Body metrics will expand with trends and measurements in a later phase.",
  workout: "Workout tracking will get richer training details in a later phase.",
  nutrition: "Nutrition tracking will expand beyond the quick daily totals in a later phase.",
  recovery: "Recovery will bring deeper sleep and stress context in a later phase.",
  insights: "Insights will stay general and wellness-focused when this tab is built.",
  reports: "Reports will summarize local health trends in a later phase.",
};

export function HealthPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<HealthTab>("overview");
  const {
    bodyMetricLogs,
    bodyMetricOverviewStats,
    deleteBodyMetricLog,
    deleteLog,
    deleteMealTemplate,
    deleteNutritionMeal,
    deleteRecoveryCheckIn,
    deleteWorkoutLog,
    logs,
    mealTemplates,
    nutritionMeals,
    nutritionOverviewStats,
    overviewStats,
    recoveryCheckIns,
    recoveryOverviewStats,
    saveMealTemplate,
    saveNutritionMeal,
    saveTodayRecoveryCheckIn,
    saveTodayBodyMetricLog,
    saveTodayLog,
    saveWorkoutLog,
    workoutLogs,
    workoutOverviewStats,
  } = useHealth();

  return (
    <div className="health-page">
      <ScreenHeader
        title="Health"
        description="Track your body, recovery, workout, and wellness signals locally."
      />

      <HealthTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="health-tab-panel">
          <HealthOverviewCards
            latestWeightKg={overviewStats.latestWeightKg}
            todayLog={overviewStats.todayLog}
          />
          <div className="health-overview-layout">
            <HealthQuickLogForm
              onSave={saveTodayLog}
              todayLog={overviewStats.todayLog}
            />
            <HealthRecentLogs logs={logs} onDelete={deleteLog} />
          </div>
        </div>
      ) : null}

      {activeTab === "body" ? (
        <BodyMetricsTab
          logs={bodyMetricLogs}
          onDeleteLog={deleteBodyMetricLog}
          onSaveTodayLog={saveTodayBodyMetricLog}
          overviewStats={bodyMetricOverviewStats}
        />
      ) : null}

      {activeTab === "workout" ? (
        <WorkoutTab
          logs={workoutLogs}
          onDeleteLog={deleteWorkoutLog}
          onSaveLog={saveWorkoutLog}
          overviewStats={workoutOverviewStats}
        />
      ) : null}

      {activeTab === "nutrition" ? (
        <NutritionTab
          meals={nutritionMeals}
          onDeleteMeal={deleteNutritionMeal}
          onDeleteTemplate={deleteMealTemplate}
          onSaveMeal={saveNutritionMeal}
          onSaveTemplate={saveMealTemplate}
          overviewStats={nutritionOverviewStats}
          templates={mealTemplates}
        />
      ) : null}

      {activeTab === "recovery" ? (
        <RecoveryTab
          checkIns={recoveryCheckIns}
          healthLogs={logs}
          onDeleteCheckIn={deleteRecoveryCheckIn}
          onSaveTodayCheckIn={saveTodayRecoveryCheckIn}
          overviewStats={recoveryOverviewStats}
          workoutLogs={workoutLogs}
        />
      ) : null}

      {activeTab === "insights" ? (
        <InsightsTab
          bodyMetricLogs={bodyMetricLogs}
          healthLogs={logs}
          nutritionMeals={nutritionMeals}
          recoveryCheckIns={recoveryCheckIns}
          workoutLogs={workoutLogs}
        />
      ) : null}

      {activeTab !== "overview" &&
      activeTab !== "body" &&
      activeTab !== "workout" &&
      activeTab !== "nutrition" &&
      activeTab !== "recovery" &&
      activeTab !== "insights" ? (
        <Card title={getTabTitle(activeTab)}>
          <EmptyState title="Coming soon" description={COMING_SOON_COPY[activeTab]} />
        </Card>
      ) : null}
    </div>
  );
}

function getTabTitle(tab: Exclude<HealthTab, "overview">): string {
  const titles: Record<Exclude<HealthTab, "overview">, string> = {
    body: "Body Metrics",
    workout: "Workout",
    nutrition: "Nutrition",
    recovery: "Recovery",
    insights: "Insights",
    reports: "Reports",
  };

  return titles[tab];
}
