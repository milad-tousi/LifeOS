import {
  Activity,
  Battery,
  Droplet,
  Dumbbell,
  Moon,
  Scale,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import {
  calculateEnergyStatus,
  calculateHealthScore,
  calculateSleepStatus,
  calculateStressStatus,
  calculateWaterStatus,
  calculateWorkoutStatus,
  getHealthScoreStatus,
} from "@/features/health/services/healthCalculations";
import { HealthLog } from "@/features/health/types/health.types";

interface HealthOverviewCardsProps {
  todayLog: HealthLog | null;
  latestWeightKg: number | null;
}

export function HealthOverviewCards({
  latestWeightKg,
  todayLog,
}: HealthOverviewCardsProps): JSX.Element {
  const score = todayLog ? calculateHealthScore(todayLog) : null;
  const sleepStatus = todayLog ? calculateSleepStatus(todayLog.sleepHours) : null;
  const waterStatus = todayLog ? calculateWaterStatus(todayLog.waterLiters) : null;
  const workoutStatus = todayLog
    ? calculateWorkoutStatus(todayLog.workoutMinutes, todayLog.workoutCompleted)
    : null;
  const energyStatus = todayLog ? calculateEnergyStatus(todayLog.energyLevel) : null;
  const stressStatus = todayLog ? calculateStressStatus(todayLog.stressLevel) : null;

  const items = [
    {
      title: "Health Score",
      value: score ? `${score.total}/100` : "--/100",
      status: score ? getHealthScoreStatus(score.total) : "No log today",
      helper: "Based on today's sleep, hydration, workout, energy, and stress.",
      icon: <Activity size={18} />,
      tone: "score",
    },
    {
      title: "Sleep",
      value: todayLog ? `${formatNumber(todayLog.sleepHours)} h` : "-- h",
      status: sleepStatus?.status ?? "No log today",
      helper: sleepStatus?.helper ?? "Log sleep hours to track recovery.",
      icon: <Moon size={18} />,
      tone: "sleep",
    },
    {
      title: "Water",
      value: todayLog ? `${formatNumber(todayLog.waterLiters)} L` : "-- L",
      status: waterStatus?.status ?? "No log today",
      helper: waterStatus?.helper ?? "Log hydration to keep the daily picture clear.",
      icon: <Droplet size={18} />,
      tone: "water",
    },
    {
      title: "Workout",
      value: todayLog ? `${todayLog.workoutMinutes} min` : "-- min",
      status: workoutStatus?.status ?? "No log today",
      helper: workoutStatus?.helper ?? "Log movement when you complete it.",
      icon: <Dumbbell size={18} />,
      tone: "workout",
    },
    {
      title: "Energy / Stress",
      value: todayLog ? `${todayLog.energyLevel}/5 / ${todayLog.stressLevel}/5` : "--",
      status:
        energyStatus && stressStatus
          ? `${energyStatus.status} energy, ${stressStatus.status.toLowerCase()} stress`
          : "No log today",
      helper:
        energyStatus && stressStatus
          ? `${energyStatus.helper} ${stressStatus.helper}`
          : "Rate energy and stress to understand your day.",
      icon: <Battery size={18} />,
      tone: "energy",
    },
    {
      title: "Weight",
      value: latestWeightKg ? `${formatNumber(latestWeightKg)} kg` : "-- kg",
      status: latestWeightKg ? "Latest logged" : "No weight yet",
      helper: "Weight is shown from the latest available health log.",
      icon: <Scale size={18} />,
      tone: "weight",
    },
  ] as const;

  return (
    <div className="health-overview-grid">
      {items.map((item) => (
        <Card key={item.title}>
          <div className={`health-overview-card health-overview-card--${item.tone}`}>
            <div className="health-overview-card__top">
              <span className="health-overview-card__icon">{item.icon}</span>
              <span className="health-overview-card__title">{item.title}</span>
            </div>
            <strong className="health-overview-card__value">{item.value}</strong>
            <span className="health-overview-card__status">{item.status}</span>
            <p className="health-overview-card__helper">{item.helper}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
